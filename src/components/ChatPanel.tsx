import { useState, useEffect, useRef, useCallback } from "react"
import { api, connectRoomSocket, type Message, type SharedFile, type AuthUser } from "@/lib/api"
import { deriveKey, encryptText, decryptText, encryptFile, decryptFile } from "@/lib/crypto"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Send, Paperclip, File, Download, Upload, Image, FileText, Film, Lock } from "lucide-react"
import { cn, getAvatarColor } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

type Props = {
  roomId: string
  user: AuthUser
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

function fileIcon(type: string) {
  if (type.startsWith("image/")) return Image
  if (type.startsWith("video/")) return Film
  if (type.includes("pdf") || type.startsWith("text/")) return FileText
  return File
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ChatPanel({ roomId, user }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [files, setFiles] = useState<SharedFile[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  
  const displayName = user.user_metadata?.display_name || user.username || "User"

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  // Derive E2EE Key on mount
  useEffect(() => {
    deriveKey(roomId).then(setCryptoKey)
  }, [roomId])

  const fetchMessages = useCallback(async () => {
    if (!cryptoKey) return
    try {
      const data = await api.getRoomMessages(roomId)
      // Decrypt all message contents
      const decrypted = await Promise.all(
        data.map(async (msg) => {
          if (msg.iv) {
            const dec = await decryptText(msg.content, msg.iv, cryptoKey)
            return { ...msg, content: dec }
          }
          return msg
        })
      )
      setMessages(decrypted)
    } catch {
      toast.error("Failed to load chat history")
    }
  }, [roomId, cryptoKey])

  const fetchFiles = useCallback(async () => {
    try {
      const data = await api.listRoomFiles(roomId)
      setFiles(data)
    } catch {
      toast.error("Failed to load shared files")
    }
  }, [roomId])

  useEffect(() => {
    if (!cryptoKey) return
    
    fetchMessages()
    fetchFiles()

    // Connect Room Socket for real-time chat & file alerts
    const ws = connectRoomSocket(
      roomId,
      async (msg) => {
        if (msg.type === "chat") {
          // Decrypt chat message on receipt
          if (msg.payload && msg.payload.content && msg.payload.iv) {
            const dec = await decryptText(msg.payload.content, msg.payload.iv, cryptoKey)
            const formatted: Message = {
              id: msg.id || String(Math.random()),
              room_id: roomId,
              user_id: msg.from_user,
              display_name: msg.display_name,
              content: dec,
              created_at: msg.created_at || new Date().toISOString()
            }
            setMessages((prev) => {
              if (prev.some((m) => m.id === formatted.id)) return prev
              return [...prev, formatted]
            })
            setTimeout(scrollToBottom, 50)
          }
        }
        else if (msg.type === "file-shared") {
          // Reload file list
          fetchFiles()
        }
      }
    )
    socketRef.current = ws

    return () => {
      ws.close()
    }
  }, [fetchMessages, fetchFiles, roomId, cryptoKey])

  useEffect(() => {
    setTimeout(scrollToBottom, 100)
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !cryptoKey || !socketRef.current) return
    setSending(true)

    try {
      // Encrypt message content before broadcasting
      const { ciphertext, iv } = await encryptText(newMessage.trim(), cryptoKey)
      
      socketRef.current.send(
        JSON.stringify({
          type: "chat",
          room_id: roomId,
          from_user: user.id,
          display_name: displayName,
          payload: {
            content: ciphertext,
            iv: iv
          }
        })
      )
      setNewMessage("")
    } catch (err) {
      console.error(err)
      toast.error("Failed to encrypt/send message")
    } finally {
      setSending(false)
    }
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !cryptoKey || !socketRef.current) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large (max 50MB)")
      return
    }

    setUploading(true)
    const toastId = toast.loading(`Encrypting & uploading ${file.name}...`)

    try {
      // 1. Encrypt file locally on the client
      const { encryptedBlob, iv } = await encryptFile(file, cryptoKey)

      // 2. POST encrypted blob to Django
      await api.uploadFile(
        roomId,
        encryptedBlob,
        file.name,
        file.size,
        file.type || "application/octet-stream",
        displayName,
        iv
      )

      // 3. Broadcast WebSocket notification so others reload file list
      socketRef.current.send(
        JSON.stringify({
          type: "file-shared",
          room_id: roomId,
          from_user: user.id,
          payload: {}
        })
      )

      toast.success(`${file.name} shared securely!`, { id: toastId })
      fetchFiles()
    } catch (err) {
      console.error(err)
      toast.error("Failed to encrypt or upload file", { id: toastId })
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ""
    }
  }

  const downloadFile = async (file: SharedFile) => {
    if (!cryptoKey) return
    const toastId = toast.loading(`Downloading & decrypting ${file.file_name}...`)
    try {
      // 1. Fetch encrypted binary blob from Django
      const encryptedBlob = await api.downloadFile(file.file_url)

      // 2. Decrypt binary blob locally on client
      const decryptedBlob = await decryptFile(encryptedBlob, file.iv || "", file.file_type, cryptoKey)

      // 3. Trigger download of the decrypted blob
      const url = URL.createObjectURL(decryptedBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.file_name
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success("Decrypted successfully!", { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error("Decryption failed. Invalid room key.", { id: toastId })
    }
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="flex flex-col h-full bg-[#17181C]">
      <Tabs defaultValue="chat" className="flex flex-col h-full bg-[#17181C]">
        {/* Light tabs selector matching mockup */}
        <div className="px-3 py-2.5 bg-white border-b border-slate-150 shrink-0">
          <TabsList className="w-full bg-slate-100 p-0.5 rounded-xl">
            <TabsTrigger 
              value="chat" 
              className="flex-1 rounded-lg text-sm font-bold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-950 transition-all py-2"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger 
              value="files" 
              className="flex-1 rounded-lg text-sm font-bold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-950 transition-all py-2"
            >
              Files
              {files.length > 0 && (
                <span className="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-800 shrink-0">{files.length}</span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Chat tab */}
        <TabsContent value="chat" className="flex flex-col flex-1 overflow-hidden mt-0 px-0">
          <div className="bg-[#1a2d24] px-3 py-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider select-none shrink-0 border-b border-white/5">
            <Lock className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted (AES-GCM)</span>
          </div>
          <ScrollArea className="flex-1 bg-[#121214] px-3">
            <div ref={scrollRef} className="space-y-3.5 py-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8 font-medium">
                  No messages yet. Start the conversation!
                </div>
              )}
              {messages.map((msg) => {
                const isOwn = msg.user_id === user.id
                return (
                  <div key={msg.id} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                    {!isOwn && (
                      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                        <AvatarFallback className={cn("text-xs text-white", getAvatarColor(msg.display_name))}>
                          {getInitials(msg.display_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-[75%] space-y-0.5", isOwn && "items-end flex flex-col")}>
                      {!isOwn && (
                        <span className="text-xs text-slate-300 font-semibold">{msg.display_name}</span>
                      )}
                      <div
                        className={cn(
                          "px-3 py-2 rounded-2xl text-sm leading-snug font-semibold text-white",
                          isOwn
                            ? "bg-gradient-to-r from-orange-500 to-red-500 rounded-tr-sm"
                            : "bg-[#26272C] rounded-tl-sm"
                        )}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
          
          {/* Bottom input area matching mockup layout */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 bg-[#17181C] border-t border-white/5">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a secure message..."
              className="flex-1 bg-[#1a1a20] border border-white/10 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500/50"
              disabled={sending || !cryptoKey}
            />
            <button 
              type="submit" 
              disabled={sending || !newMessage.trim() || !cryptoKey}
              style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(150deg, #FF4A16, #E52603)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(229,38,3,0.3)' }}
              className="hover:brightness-110 active:scale-95 transition-all text-white disabled:opacity-40 disabled:pointer-events-none"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </TabsContent>

        {/* Files tab */}
        <TabsContent value="files" className="flex flex-col flex-1 overflow-hidden mt-0 bg-[#121214]">
          <div className="bg-[#1a2d24] px-3 py-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider select-none shrink-0 border-b border-white/5">
            <Lock className="w-3.5 h-3.5" />
            <span>Files Encrypted before upload</span>
          </div>
          <div className="px-3 py-3 bg-[#121214]">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={uploadFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !cryptoKey}
              className="w-full h-10 text-xs font-bold text-white bg-[#26272C] hover:bg-[#33343a] border-none rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Securely Share File
                </>
              )}
            </button>
          </div>
          <ScrollArea className="flex-1 px-3 bg-[#121214]">
            <div className="space-y-2 pb-4">
              {files.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8 font-medium">
                  No files shared yet
                </div>
              )}
              {files.map((file) => {
                const Icon = fileIcon(file.file_type)
                return (
                  <div key={file.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded bg-[#1a1a20] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate text-white">{file.file_name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {formatBytes(file.file_size)} · {file.display_name}
                      </div>
                    </div>
                    <button
                      className="h-7 w-7 p-0 shrink-0 text-slate-300 hover:text-white bg-transparent border-none cursor-pointer flex items-center justify-center"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
          <div className="px-3 py-2 border-t border-white/5 bg-[#17181C]">
            <p className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
              <Paperclip className="w-3 h-3" />
              Max 50MB per file
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
