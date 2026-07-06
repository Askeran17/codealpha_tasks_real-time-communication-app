import { useState, useEffect, useRef, useCallback } from "react"
import { api, connectRoomSocket, closeRoomSocket, type Message, type SharedFile, type AuthUser } from "@/lib/api"
import { deriveKey, encryptText, decryptText, encryptFile, decryptFile } from "@/lib/crypto"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  Send, File, Download, Upload, Image, FileText, Film, Lock, Trash2,
  Plus, Smile, Shield, ChevronRight
} from "lucide-react"
import { cn, getAvatarColor } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

type Props = {
  roomId: string
  user: AuthUser
  mode?: "chat" | "files"
  // Called after a file finishes uploading — lets the parent switch to the
  // Files tab so the result is actually visible instead of just a toast.
  onFileShared?: () => void
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

const EMOJI_OPTIONS = [
  "😀", "😂", "😍", "😊", "🙌", "👍", "👏", "🎉",
  "❤️", "🔥", "😢", "😮", "🤔", "🙏", "✅", "🚀",
]

export default function ChatPanel({ roomId, user, mode = "chat", onFileShared }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [files, setFiles] = useState<SharedFile[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  
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

    const ws = connectRoomSocket(
      roomId,
      async (msg) => {
        if (msg.type === "chat") {
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
          fetchFiles()
        }
      }
    )
    socketRef.current = ws

    return () => {
      closeRoomSocket(ws)
    }
  }, [fetchMessages, fetchFiles, roomId, cryptoKey])

  useEffect(() => {
    setTimeout(scrollToBottom, 100)
  }, [messages, mode])

  useEffect(() => {
    if (!showEmojiPicker) return
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showEmojiPicker])

  const insertEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !cryptoKey || !socketRef.current) return
    setSending(true)

    try {
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
      const { encryptedBlob, iv } = await encryptFile(file, cryptoKey)

      await api.uploadFile(
        roomId,
        encryptedBlob,
        file.name,
        file.size,
        file.type || "application/octet-stream",
        displayName,
        iv
      )

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
      onFileShared?.()
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
      const encryptedBlob = await api.downloadFile(file.file_url)
      const decryptedBlob = await decryptFile(encryptedBlob, file.iv || "", file.file_type, cryptoKey)

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

  const deleteSharedFile = async (file: SharedFile) => {
    try {
      await api.deleteFile(file.id)
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      toast.success("File deleted")
    } catch {
      toast.error("Failed to delete file")
    }
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)


  if (mode === "files") {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-[#121214] select-none">
        
        {/* End-to-end Encrypted Green Notice Banner */}
        <div className="mx-4 my-3 px-4 py-3 bg-[#15291E]/90 border border-[#1b3d2b] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1A3F2A] flex items-center justify-center shrink-0">
              <Shield className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-white leading-tight">Shared files encrypted</h4>
              <p className="text-[11px] text-stone-400 mt-0.5">Files are encrypted before upload</p>
            </div>
          </div>
        </div>

        {/* Upload Trigger area */}
        <div className="px-4 py-3 bg-[#121214]">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={uploadFile}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !cryptoKey}
            className="w-full h-11 text-xs font-bold text-white bg-[#1E1F24] hover:bg-[#2e2f36] border border-white/5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            {uploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="w-4.5 h-4.5 text-stone-300" />
                Securely Share File
              </>
            )}
          </button>
        </div>

        {/* Scroll list of shared files */}
        <ScrollArea className="flex-1 min-h-0 px-4 bg-[#121214]">
          <div className="space-y-2.5 pb-4">
            {files.length === 0 && (
              <div className="text-center text-stone-500 text-sm py-8 font-medium">
                No files shared yet in this session.
              </div>
            )}
            {files.map((file) => {
              const Icon = fileIcon(file.file_type)
              return (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#1E1F24] border border-white/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#17181C] flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-white max-w-[150px]">{file.file_name}</div>
                      <div className="text-[10px] text-stone-500 font-semibold mt-0.5">
                        {formatBytes(file.file_size)} · {file.display_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="h-8.5 w-8.5 rounded-lg flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 border-none cursor-pointer"
                      onClick={() => downloadFile(file)}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {file.user_id === user.id && (
                      <button
                        className="h-8.5 w-8.5 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-400 hover:bg-white/5 border-none cursor-pointer"
                        onClick={() => deleteSharedFile(file)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        
        {/* Footer info banner */}
        <div className="px-4 py-3 border-t border-white/5 bg-[#121214]">
          <p className="text-xs text-stone-500 flex items-center gap-1.5 font-bold">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            Max 50MB per file
          </p>
        </div>

      </div>
    )
  }

  // DEFAULT MODE: "chat"
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#121214] select-none">
      
      {/* End-to-end Encrypted Green Notice Banner */}
      <div 
        onClick={() => toast.info("All messages are fully encrypted using AES-GCM 256 keys on your local browser.")}
        className="mx-4 my-3 px-4 py-3 bg-[#15291E]/90 border border-[#1b3d2b] rounded-2xl flex items-center justify-between cursor-pointer hover:bg-[#1c3829] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1A3F2A] flex items-center justify-center shrink-0">
            <Shield className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-white leading-tight">End-to-end encrypted</h4>
            <p className="text-[11px] text-stone-400 mt-0.5">Messages are secured and private</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-stone-500" />
      </div>

      {/* Messages Scroll Panel */}
      <ScrollArea className="flex-1 min-h-0 px-4">
        <div ref={scrollRef} className="space-y-5.5 py-4">
          

          {/* Render Actual Dynamic Database Messages */}
          {messages.map((msg) => {
            const isOwn = msg.user_id === user.id
            return (
              <div key={msg.id} className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
                {!isOwn && (
                  <Avatar className="w-9 h-9 shrink-0 border border-white/5">
                    <AvatarFallback className={cn("text-xs text-white", getAvatarColor(msg.display_name))}>
                      {getInitials(msg.display_name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-[80%] space-y-1", isOwn && "items-end flex flex-col")}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-bold text-white">{msg.display_name}</span>
                    <span className="text-[10px] font-semibold text-stone-500">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed font-medium text-white shadow-sm",
                      isOwn
                        ? "bg-gradient-to-r from-orange-500 to-red-500 rounded-tr-sm"
                        : "bg-[#1E1F24] rounded-tl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
      
      {/* Typing field overlay */}
      <div className="relative p-4 bg-[#121214] border-t border-white/5">
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full left-4 mb-2 grid grid-cols-8 gap-1 p-2 bg-[#1E1F24] border border-white/10 rounded-2xl shadow-lg z-10"
          >
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-white/5 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={sendMessage} className="bg-[#1E1F24] rounded-2xl p-2 border border-white/5">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-transparent text-[13.5px] border-none focus:outline-none text-white placeholder-stone-500 px-3.5 py-2"
            disabled={sending || !cryptoKey}
          />

          <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2 px-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !cryptoKey}
                title="Attach a file"
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                title="Insert emoji"
                className={cn(
                  "p-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors cursor-pointer",
                  showEmojiPicker ? "text-white bg-white/5" : "text-stone-400"
                )}
              >
                <Smile className="w-4.5 h-4.5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={uploadFile}
              />
            </div>

            <button 
              type="submit" 
              disabled={sending || !newMessage.trim() || !cryptoKey}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6A2E] to-[#FF2E63] text-white flex items-center justify-center cursor-pointer shadow-md shadow-red-500/10 hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Send className="w-4 h-4 fill-white text-[#FF6A2E]" />
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}
