import { useEffect, useState } from "react"
import { api, type AuthUser } from "@/lib/api"
import { toast } from "sonner"
import { useWebRTC } from "@/hooks/use-webrtc"
import VideoTile from "@/components/VideoTile"
import ChatPanel from "@/components/ChatPanel"
import Whiteboard from "@/components/Whiteboard"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  PenLine,
  PhoneOff,
  Users,
  Shield,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  roomId: string
  user: AuthUser
  onLeave: () => void
}

type Panel = "chat" | "whiteboard" | null

export default function RoomPage({ roomId, user, onLeave }: Props) {
  const [activePanel, setActivePanel] = useState<Panel>("chat")
  const [seconds, setSeconds] = useState(24 * 3600 + 22 * 60 + 52) // Initial count-up duration state

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDuration = () => {
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  const {
    localStream,
    screenStream,
    peers,
    localState,
    displayName,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  } = useWebRTC(roomId, user)

  const peersArray = Array.from(peers.values())
  const totalParticipants = 1 + peersArray.length

  // iOS Safari doesn't shrink `100dvh` when the on-screen keyboard opens, so
  // the room (sized by dvh, overflow-hidden) stays full-height while the
  // keyboard covers its bottom — pushing the chat input off-screen with no
  // way to scroll it back into view. Tracking visualViewport instead keeps
  // the room's actual height in sync with the space left above the keyboard.
  useEffect(() => {
    const setViewportHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty("--room-vh", `${height}px`)
    }
    setViewportHeight()
    window.visualViewport?.addEventListener("resize", setViewportHeight)
    window.addEventListener("resize", setViewportHeight)
    return () => {
      window.visualViewport?.removeEventListener("resize", setViewportHeight)
      window.removeEventListener("resize", setViewportHeight)
    }
  }, [])

  // Rooms are now reachable by pasting/opening a shared link, so a stale
  // or mistyped ID needs a clean bounce back home instead of a silent
  // WebRTC/chat failure inside a room that doesn't exist.
  useEffect(() => {
    let cancelled = false
    api.getRoom(roomId).catch(() => {
      if (!cancelled) {
        toast.error("Room not found — it may have been deleted")
        onLeave()
      }
    })
    return () => {
      cancelled = true
    }
  }, [roomId, onLeave])

  const togglePanel = (panel: Panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
  }

  const handleScreenShare = () => {
    if (localState.screenSharing) stopScreenShare()
    else startScreenShare()
  }

  const handleCopyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/room/${roomId}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success("Invite link copied!")
    } catch {
      toast.error("Could not copy link")
    }
  }

  // Determine video grid columns
  const gridCols =
    totalParticipants === 1
      ? "grid-cols-1"
      : totalParticipants === 2
      ? "grid-cols-2"
      : totalParticipants <= 4
      ? "grid-cols-2"
      : "grid-cols-3"

  // Same column counts, scoped to the sm+ breakpoint — used when the side
  // panel is open on mobile, where the video area becomes a small
  // horizontally-scrolling strip instead of a grid.
  const gridColsSm =
    totalParticipants === 1
      ? "sm:grid-cols-1"
      : totalParticipants === 2
      ? "sm:grid-cols-2"
      : totalParticipants <= 4
      ? "sm:grid-cols-2"
      : "sm:grid-cols-3"

  return (
    <div
      className="flex flex-col bg-[#17181C] overflow-hidden"
      style={{ height: "var(--room-vh, 100dvh)", fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 md:px-5 h-14 border-b border-white/5 bg-[#17181C] shrink-0 text-white select-none">
        <div className="w-2.5 h-2.5 rounded-full bg-[#F42B03]"></div>
        <div className="text-sm md:text-base font-bold truncate">Team Sync Meeting</div>
        <div className="flex items-center gap-1.5 text-[#FF4A16] font-extrabold text-[11px] md:text-xs tracking-wider shrink-0 ml-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF4A16] animate-pulse"></div>
          LIVE
        </div>
        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md tracking-wider shrink-0 ml-1.5 select-none">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>E2EE SECURE</span>
        </div>
        <div className="text-slate-400 font-semibold font-variant-numeric-tabular-nums text-xs md:text-sm shrink-0 ml-1">{formatDuration()}</div>
        
        <div className="flex-grow"></div>
        
        <div className="flex items-center gap-4">
          {/* Invite link copied button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8.5 gap-1.5 px-3 text-xs bg-white/5 hover:bg-white/10 text-white border-white/10"
                onClick={handleCopyInviteLink}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy invite link</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 bg-white/10" />

          {/* Participants */}
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-white/90">
            <Users className="w-4.5 h-4.5" />
            <span>{totalParticipants}</span>
          </div>

          <Separator orientation="vertical" className="h-4 bg-white/10" />

          {/* Toggle chat bubble */}
          <button 
            onClick={() => togglePanel("chat")}
            className="bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <MessageSquare className="w-4.5 h-4.5 text-[#E8E9EC]" />
          </button>

          <svg className="ml-2.5 cursor-pointer hover:opacity-80 transition-opacity" width="19" height="19" viewBox="0 0 24 24" fill="#E8E9EC">
            <circle cx="12" cy="5" r="1.6"></circle>
            <circle cx="12" cy="12" r="1.6"></circle>
            <circle cx="12" cy="19" r="1.6"></circle>
          </svg>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Video area */}
          <div
            className={cn(
              "overflow-hidden",
              activePanel ? "w-full aspect-video shrink-0 sm:h-auto sm:flex-1" : "flex-1"
            )}
          >
            <div
              className={cn(
                "h-full gap-2 p-3",
                activePanel
                  ? cn("flex items-center overflow-x-auto sm:grid sm:overflow-auto sm:content-start", gridColsSm)
                  : cn("grid overflow-auto content-start", gridCols)
              )}
            >
              {/* Local video */}
              <VideoTile
                stream={localState.screenSharing ? screenStream : localStream}
                displayName={displayName}
                audioEnabled={localState.audioEnabled}
                videoEnabled={localState.videoEnabled || localState.screenSharing}
                screenSharing={localState.screenSharing}
                isLocal
                className={cn("shrink-0", activePanel && "max-w-full max-h-full")}
              />
              {/* Remote peers */}
              {peersArray.map((peer) => (
                <VideoTile
                  key={peer.userId}
                  stream={peer.stream}
                  displayName={peer.displayName}
                  audioEnabled={peer.audioEnabled}
                  videoEnabled={peer.videoEnabled}
                  screenSharing={peer.screenSharing}
                  className={cn("shrink-0", activePanel && "max-w-full max-h-full")}
                />
              ))}
            </div>
          </div>

          {/* Side panel */}
          {activePanel && (
            <div
              className={cn(
                "flex-1 flex flex-col overflow-hidden",
                "sm:flex-none sm:w-80 sm:border-l sm:border-border",
                activePanel === "whiteboard" && "sm:w-96"
              )}
            >
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-150 bg-white shrink-0">
                <div className="flex items-center gap-2">
                  {activePanel === "chat" ? (
                    <>
                      <MessageSquare className="w-4.5 h-4.5 text-slate-800" />
                      <span className="text-sm font-bold text-slate-900">Chat & Files</span>
                    </>
                  ) : (
                    <>
                      <PenLine className="w-4.5 h-4.5 text-slate-800" />
                      <span className="text-sm font-bold text-slate-900">Whiteboard</span>
                      <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">Live</Badge>
                    </>
                  )}
                </div>
                <button
                  className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border-none bg-transparent cursor-pointer font-bold text-lg leading-none"
                  onClick={() => setActivePanel(null)}
                >
                  ×
                </button>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                {activePanel === "chat" ? (
                  <ChatPanel roomId={roomId} user={user} />
                ) : (
                  <Whiteboard roomId={roomId} user={user} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-4 bg-[#17181C] border-t border-white/5 text-white">
          {/* Left / Center Actions */}
          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleAudio}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors border-none",
                    localState.audioEnabled ? "bg-[#26272C] hover:bg-[#33343a] text-white" : "bg-destructive text-white"
                  )}
                >
                  {localState.audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{localState.audioEnabled ? "Mute" : "Unmute"}</TooltipContent>
            </Tooltip>

            {/* Video Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleVideo}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors border-none",
                    localState.videoEnabled ? "bg-[#26272C] hover:bg-[#33343a] text-white" : "bg-destructive text-white"
                  )}
                >
                  {localState.videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{localState.videoEnabled ? "Stop Video" : "Start Video"}</TooltipContent>
            </Tooltip>

            {/* Screen Share Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleScreenShare}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors border-none",
                    localState.screenSharing ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" : "bg-[#26272C] hover:bg-[#33343a] text-white"
                  )}
                >
                  {localState.screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{localState.screenSharing ? "Stop Sharing" : "Share Screen"}</TooltipContent>
            </Tooltip>

            {/* Chat Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => togglePanel("chat")}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors border-none",
                    activePanel === "chat" ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" : "bg-[#26272C] hover:bg-[#33343a] text-white"
                  )}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Chat & Files</TooltipContent>
            </Tooltip>

            {/* Whiteboard Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => togglePanel("whiteboard")}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors border-none",
                    activePanel === "whiteboard" ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" : "bg-[#26272C] hover:bg-[#33343a] text-white"
                  )}
                >
                  <PenLine className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Whiteboard</TooltipContent>
            </Tooltip>

            {/* Rotated Hangup Phone Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={onLeave} 
                  style={{ 
                    width: '76px', 
                    height: '46px', 
                    borderRadius: '999px', 
                    background: 'linear-gradient(150deg, #FF4A16, #E52603)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginLeft: '14px', 
                    cursor: 'pointer', 
                    boxShadow: '0 6px 16px rgba(229,38,3,0.4)', 
                    transition: 'all 0.2s', 
                    border: 'none' 
                  }} 
                  className="hover:brightness-110 active:scale-95 shrink-0"
                >
                  <PhoneOff style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }} className="w-5 h-5 text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Leave Room</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex-grow"></div>

          {/* Right side items */}
          <div className="flex items-center gap-5.5 text-slate-400">
            {/* Grid Layout Icon */}
            <svg className="cursor-pointer hover:text-white transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
            </svg>

            {/* Record Icon */}
            <svg className="cursor-pointer hover:brightness-110 transition-all" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"></circle>
              <circle cx="12" cy="12" r="4" fill="#F42B03"></circle>
            </svg>

            {/* Security Shield Icon */}
            <svg className="cursor-pointer hover:text-white transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
