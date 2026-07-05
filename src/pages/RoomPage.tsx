import { useEffect, useState } from "react"
import { api, type AuthUser } from "@/lib/api"
import { toast } from "sonner"
import { useWebRTC } from "@/hooks/use-webrtc"
import { useCallRecorder } from "@/hooks/use-call-recorder"
import SettingsDialog from "@/components/SettingsDialog"
import VideoTile from "@/components/VideoTile"
import ChatPanel from "@/components/ChatPanel"
import Whiteboard from "@/components/Whiteboard"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  PhoneOff,
  Users,
  Shield,
  Link2,
  Settings,
  Crown,
  ChevronDown,
  X,
  Menu,
  Maximize2,
  Volume2,
  Smile,
  Circle,
  MoreHorizontal,
  MoreVertical,
  Folder,
  ChevronRight,
  Hand
} from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  roomId: string
  user: AuthUser
  onLeave: () => void
}

type Panel = "chat" | "files" | "people" | "whiteboard" | null

export default function RoomPage({ roomId, user, onLeave }: Props) {
  const [activePanel, setActivePanel] = useState<Panel>("chat")
  const [seconds, setSeconds] = useState(0) // Starting meeting timer from zero
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null)
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([])
  const [activeAudioInputId, setActiveAudioInputId] = useState<string | null>(null)

  const loadAudioInputs = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setAudioInputs(devices.filter((d) => d.kind === "audioinput"))
    } catch {
      // Device labels require permission, which the active call already has;
      // if this still fails there's nothing else to try.
    }
  }

  // Clock ticking
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

  // WebRTC Hook connection
  const {
    localStream,
    screenStream,
    peers,
    localState,
    displayName,
    reactions,
    toggleAudio,
    toggleVideo,
    toggleHandRaise,
    sendReaction,
    switchAudioInput,
    startScreenShare,
    stopScreenShare,
  } = useWebRTC(roomId, user)

  const recorder = useCallRecorder(localStream, screenStream, peers, roomId, displayName)

  const peersArray = Array.from(peers.values())
  const activePeer = (pinnedPeerId && peersArray.find(p => p.userId === pinnedPeerId))
    || peersArray.find(p => p.screenSharing)
    || peersArray[0]
    || null
  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const [audioLevel, setAudioLevel] = useState(0)

  useEffect(() => {
    const audioTrack = localStream?.getAudioTracks()[0]
    if (!audioTrack || !localState.audioEnabled) {
      setAudioLevel(0)
      return
    }

    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]))
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.4
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)

    let rafId: number
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length
      setAudioLevel(avg / 120)
      rafId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafId)
      source.disconnect()
      audioContext.close()
    }
  }, [localStream, localState.audioEnabled])

  // Viewport tracking for mobile keyboards
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

  // Verify room exists on load
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


  // Sidebar navigation links definition (dark mode version) — these all
  // toggle panels within the room itself.
  const navItems: { name: string; icon: any; active: boolean; onClick: () => void; badge?: number }[] = [
    { name: "Chats", icon: MessageSquare, active: activePanel === "chat", onClick: () => togglePanel("chat") },
    { name: "People", icon: Users, active: activePanel === "people", onClick: () => togglePanel("people") },
    { name: "Files", icon: Folder, active: activePanel === "files", onClick: () => togglePanel("files") },
    { name: "Settings", icon: Settings, active: settingsOpen, onClick: () => setSettingsOpen(true) },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between select-none">
      {/* Brand logo */}
      <div>
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF6A2E] to-[#FF3E1D] rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <VideoIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-white">Meet</span>
            <span className="text-[#FF6A2E]">Flow</span>
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => {
                  item.onClick()
                  setMobileSidebarOpen(false)
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-3 text-[15px] font-medium rounded-xl transition-all duration-200 cursor-pointer text-left",
                  item.active
                    ? "bg-[#1C1C21] text-[#FF6A2E]"
                    : "text-stone-400 hover:bg-[#1A1A20] hover:text-white"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={cn("w-[21px] h-[21px]", item.active ? "text-[#FF6A2E]" : "text-stone-500")} />
                  {item.name}
                </div>
                {item.badge && (
                  <span className="w-5 h-5 bg-[#FF2E63] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Upgrade to Pro Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2E1E1E] to-[#171626] border border-[#2C2A3A] bg-clip-padding p-5 rounded-2xl">
        {/* Soft background glow circles */}
        <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-[#FF6A2E]/10 blur-md pointer-events-none"></div>
        <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-[#8B5CF6]/10 blur-md pointer-events-none"></div>
        
        <div className="w-9 h-9 bg-white/5 rounded-lg shadow-sm flex items-center justify-center mb-4">
          <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
        </div>
        <h3 className="text-base font-bold text-white mb-1.5">Upgrade to Pro</h3>
        <p className="text-xs text-stone-400 leading-relaxed mb-4">
          Unlock premium features and enhanced security.
        </p>
        <button 
          onClick={() => toast.info("Premium plans are currently invitation-only.")}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FF6A2E] to-[#FF2E63] text-white text-sm font-semibold rounded-xl hover:opacity-95 transition-opacity shadow-sm shadow-red-500/10 cursor-pointer flex items-center justify-center gap-1"
        >
          Upgrade Now
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )

  return (
    <div 
      className="flex bg-[#0B0C0E] overflow-hidden text-white w-full select-none"
      style={{ height: "var(--room-vh, 100dvh)", fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <SettingsDialog user={user} open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Desktop Sidebar (Left side panel) */}
      <aside className="hidden lg:block w-[280px] bg-[#111214] border-r border-white/5 p-6 shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Slider */}
      <aside 
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 w-[280px] bg-[#111214] border-r border-white/5 p-6 z-50 transition-transform duration-300 transform",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button 
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-stone-900 text-stone-400 cursor-pointer"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main Calling Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* Topbar Header */}
        <header className="bg-[#111214]/65 backdrop-blur-md px-6 h-20 shrink-0 border-b border-white/5 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Button */}
            <button 
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 cursor-pointer"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold">Team Sync Meeting</h2>
            
            {/* LIVE indicator */}
            <span className="flex items-center gap-1.5 text-xs font-bold bg-red-600/10 text-red-500 border border-red-600/20 px-2 py-0.5 rounded-lg ml-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>

            {/* SECURE E2EE indicator */}
            <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg ml-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              SECURE
            </span>

            {/* Duration display */}
            <span className="text-sm font-semibold text-stone-400 font-mono ml-2 tracking-wider">
              {formatDuration()}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark Invite Pill */}
            <button 
              onClick={handleCopyInviteLink}
              className="flex items-center gap-2 py-2 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-stone-300 text-sm font-semibold transition-colors cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              Invite
            </button>

            {/* Participants counter */}
            <div className="flex items-center gap-1.5 text-sm font-bold text-stone-300">
              <Users className="w-4.5 h-4.5 text-stone-400" />
              <span>{1 + peersArray.length}</span>
            </div>

            <div className="w-[1px] h-5 bg-white/10" />

            {/* Chat toggle */}
            <button 
              onClick={() => togglePanel("chat")}
              className={cn(
                "p-2 rounded-xl transition-all cursor-pointer",
                activePanel === "chat" ? "bg-[#FF6A2E]/25 text-[#FF6A2E]" : "text-stone-300 hover:bg-white/5"
              )}
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Vertical menu dots */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-xl text-stone-300 hover:bg-white/5 cursor-pointer">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl bg-[#111214] border border-white/5">
                <DropdownMenuItem onSelect={handleCopyInviteLink}>Copy Invite Link</DropdownMenuItem>
                <DropdownMenuItem onSelect={onLeave}>Leave Conference</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile pic with status ring */}
            <div className="relative">
              <Avatar className="w-[36px] h-[36px] border border-white/10">
                <AvatarImage src={localStorage.getItem(`user-avatar-${user.id}`) || user.user_metadata?.avatar_url || ""} className="object-cover object-[center_35%]" />
                <AvatarFallback className="bg-[#FF6A2E] text-white text-xs font-bold">
                  {getInitials(user.user_metadata?.display_name || user.username)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0B0C0E]" />
            </div>

          </div>
        </header>

        {/* Main interactive area split into central display and right drawer panels */}
        <div className="flex-1 flex overflow-hidden p-6 gap-6">
          
          {/* Main workspace layout: center display + bottom participant grid */}
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            
            {/* Massive central active speaker display box */}
            <div className="flex-1 relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A1B20] via-[#2F1F17] to-[#131416] border border-white/5 flex flex-col items-center justify-center">
              
              {/* Custom wavy lines decoration overlay (SVG) */}
              <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M-100 350C100 250 200 450 400 350C600 250 700 450 900 350" stroke="#FF6A2E" strokeWidth="3" />
                <path d="M-100 380C100 280 200 480 400 380C600 280 700 480 900 380" stroke="#FF2E63" strokeWidth="2.5" />
              </svg>

              {/* Floating emoji reactions burst */}
              <div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none z-20">
                <div className="relative w-full max-w-xs h-0">
                  {reactions.map((reaction) => (
                    <div
                      key={reaction.id}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center animate-reaction-float"
                    >
                      <span className="text-4xl leading-none">{reaction.emoji}</span>
                      <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full mt-1 whitespace-nowrap">
                        {reaction.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top left Tag: Connection quality */}
              <div className="absolute top-4 left-4 flex items-center gap-2 py-1.5 px-3 rounded-full bg-[#111214]/80 backdrop-blur-md border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-stone-200">High quality connection</span>
                <Volume2 className="w-3.5 h-3.5 text-stone-400" />
              </div>

              {/* Top right Tag: Maximize toggle */}
              <button 
                onClick={() => toast.info("Cinematic fullscreen mode.")}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#111214]/80 backdrop-blur-md border border-white/5 hover:bg-white/10 text-stone-300 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Render Center Content: Local User (Host) Camera Video or Initials Avatar */}
              {localState.videoEnabled || localState.screenSharing ? (
                <VideoTile
                  stream={localState.screenSharing ? screenStream : localStream}
                  displayName={displayName}
                  audioEnabled={localState.audioEnabled}
                  videoEnabled={localState.videoEnabled || localState.screenSharing}
                  screenSharing={localState.screenSharing}
                  isLocal
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center z-10">
                  {(localStorage.getItem(`user-avatar-${user.id}`) || user.user_metadata?.avatar_url) ? (
                    <img 
                      src={localStorage.getItem(`user-avatar-${user.id}`) || user.user_metadata?.avatar_url} 
                      alt={displayName} 
                      className="w-24 h-24 rounded-full object-cover object-[center_35%] border border-white/10 shadow-lg shadow-black/35 mb-4" 
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF2E63] to-[#FF6A2E] flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-red-500/20 mb-4 select-none">
                      {getInitials(displayName)}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white tracking-tight">{displayName}</h3>
                  <span className="text-xs font-bold text-stone-400 bg-white/5 py-1 px-3.5 rounded-full mt-2 select-none">
                    Host (You)
                  </span>
                </div>
              )}

              {/* Bottom right overlay: Green/orange/pink audio level indicator bars connected to real-time voice volume */}
              <div className="absolute bottom-4 right-4 flex items-end gap-1 h-8 px-3.5 bg-[#111214]/80 rounded-full border border-white/5 items-center justify-center z-10">
                <div 
                  className="w-1 bg-emerald-500 rounded-full transition-all duration-75" 
                  style={{ height: `${Math.max(4, Math.min(16, 4 + audioLevel * 16))}px` }} 
                />
                <div 
                  className="w-1 bg-emerald-500 rounded-full transition-all duration-75" 
                  style={{ height: `${Math.max(4, Math.min(24, 4 + audioLevel * 24))}px` }} 
                />
                <div 
                  className="w-1 bg-emerald-500 rounded-full transition-all duration-75" 
                  style={{ height: `${Math.max(4, Math.min(20, 4 + audioLevel * 20))}px` }} 
                />
                <div 
                  className="w-1 bg-[#FF6A2E] rounded-full transition-all duration-75" 
                  style={{ height: `${Math.max(4, Math.min(28, 4 + audioLevel * 28))}px` }} 
                />
                <div 
                  className="w-1 bg-[#FF2E63] rounded-full transition-all duration-75" 
                  style={{ height: `${Math.max(4, Math.min(12, 4 + audioLevel * 12))}px` }} 
                />
              </div>
            </div>

            {/* Bottom Row of Participant Cards (Actual WebRTC remote peers) */}
            {peersArray.length > 0 && (
              <div className="flex gap-4 shrink-0 h-40 overflow-x-auto pb-2 w-full">

                {/* Peers Cards */}
                {peersArray.map((peer) => {
                  const isSpotlighted = activePeer && activePeer.userId === peer.userId
                  return (
                    <div 
                      key={peer.userId}
                      className={cn(
                        "relative w-64 rounded-2xl overflow-hidden bg-[#16171B] border border-white/5 flex items-center justify-center shrink-0 group cursor-pointer transition-all",
                        isSpotlighted && "ring-2 ring-[#FF6A2E] shadow-lg shadow-red-500/5"
                      )}
                    >
                      {peer.videoEnabled || peer.screenSharing ? (
                        <VideoTile
                          stream={peer.stream}
                          displayName={peer.displayName}
                          audioEnabled={peer.audioEnabled}
                          videoEnabled={peer.videoEnabled}
                          screenSharing={peer.screenSharing}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#16171B] flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF2E63] to-[#FF6A2E] flex items-center justify-center text-white text-base font-bold">
                            {getInitials(peer.displayName)}
                          </div>
                        </div>
                      )}
                      {/* Hand raised badge */}
                      {peer.handRaised && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center z-10 animate-bounce">
                          <Hand className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {/* Header Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/40 text-stone-400 hover:text-white cursor-pointer z-10"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl bg-[#111214] border border-white/5 text-white">
                          <DropdownMenuItem
                            onSelect={() => setPinnedPeerId(pinnedPeerId === peer.userId ? null : peer.userId)}
                            className="cursor-pointer"
                          >
                            {pinnedPeerId === peer.userId ? "Unpin" : "Pin to main view"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* Footer Mic tag */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 py-1 px-2.5 bg-black/60 backdrop-blur-md rounded-lg z-10 w-fit">
                        {peer.audioEnabled ? (
                          <Mic className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <MicOff className="w-3 h-3 text-[#FF4A16]" />
                        )}
                        <span className="text-[11px] font-bold text-white truncate max-w-[130px]">
                          {peer.displayName}
                        </span>
                      </div>
                    </div>
                  )
                })}

              </div>
            )}

          </div>

          {/* Right Drawers (Chat & Whiteboard panels) */}
          {activePanel && (
            <div
              className={cn(
                "flex-none w-85 h-full overflow-hidden flex flex-col bg-[#121214] border border-white/5 rounded-3xl shrink-0 z-10",
                activePanel === "whiteboard" && "w-96"
              )}
            >
              {/* Right Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#121214] shrink-0">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setActivePanel("chat")}
                    className={cn(
                      "text-base font-bold transition-all relative pb-1 cursor-pointer",
                      activePanel === "chat" ? "text-white" : "text-stone-500 hover:text-stone-300"
                    )}
                  >
                    Chat
                    {activePanel === "chat" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6A2E] rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActivePanel("files")}
                    className={cn(
                      "text-base font-bold transition-all relative pb-1 cursor-pointer",
                      activePanel === "files" ? "text-white" : "text-stone-500 hover:text-stone-300"
                    )}
                  >
                    Files
                    {activePanel === "files" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6A2E] rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActivePanel("people")}
                    className={cn(
                      "text-base font-bold transition-all relative pb-1 cursor-pointer",
                      activePanel === "people" ? "text-white" : "text-stone-500 hover:text-stone-300"
                    )}
                  >
                    People
                    {activePanel === "people" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6A2E] rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActivePanel("whiteboard")}
                    className={cn(
                      "text-base font-bold transition-all relative pb-1 cursor-pointer",
                      activePanel === "whiteboard" ? "text-white" : "text-stone-500 hover:text-stone-300"
                    )}
                  >
                    Whiteboard
                    {activePanel === "whiteboard" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6A2E] rounded-full" />
                    )}
                  </button>
                </div>
                <button
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-stone-500 hover:text-white hover:bg-white/5 transition-all border-none bg-transparent cursor-pointer"
                  onClick={() => setActivePanel(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Panel Content Body */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {activePanel === "chat" ? (
                  <ChatPanel roomId={roomId} user={user} mode="chat" />
                ) : activePanel === "files" ? (
                  <ChatPanel roomId={roomId} user={user} mode="files" />
                ) : activePanel === "people" ? (
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-9 h-9 border border-white/10 shrink-0">
                          <AvatarImage src={localStorage.getItem(`user-avatar-${user.id}`) || user.user_metadata?.avatar_url || ""} className="object-cover object-[center_35%]" />
                          <AvatarFallback className="bg-[#FF6A2E] text-white text-xs font-bold">{getInitials(displayName)}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-semibold text-white truncate">{displayName} (You)</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {localState.audioEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-red-500" />}
                        {localState.videoEnabled ? <VideoIcon className="w-4 h-4 text-stone-400" /> : <VideoOff className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                    {peersArray.map((peer) => (
                      <div key={peer.userId} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF2E63] to-[#FF6A2E] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {getInitials(peer.displayName)}
                          </div>
                          <p className="text-sm font-semibold text-white truncate">{peer.displayName}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {peer.audioEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-red-500" />}
                          {peer.videoEnabled ? <VideoIcon className="w-4 h-4 text-stone-400" /> : <VideoOff className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                    ))}
                    {peersArray.length === 0 && (
                      <p className="text-sm text-stone-500 text-center py-8">No one else has joined yet.</p>
                    )}
                  </div>
                ) : (
                  <Whiteboard roomId={roomId} user={user} />
                )}
              </div>
            </div>
          )}

        </div>

        {/* Controls bar at bottom */}
        <div className="shrink-0 h-28 flex items-center justify-center bg-[#0B0C0E] border-t border-white/5 z-20 select-none">
          <div className="flex items-center gap-7">
            
            {/* Mic control */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleAudio}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white",
                        localState.audioEnabled ? "bg-[#16171B] hover:bg-[#202127]" : "bg-red-600 hover:bg-red-700"
                      )}
                    >
                      {localState.audioEnabled ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
                    </button>
                    <DropdownMenu onOpenChange={(open) => { if (open) loadAudioInputs() }}>
                      <DropdownMenuTrigger asChild>
                        <button className="w-6 h-12 rounded-full bg-[#16171B] hover:bg-[#202127] text-stone-400 hover:text-white flex items-center justify-center cursor-pointer">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="top" className="rounded-xl bg-[#111214] border border-white/5 text-white min-w-56">
                        {audioInputs.length === 0 && (
                          <div className="px-2 py-2 text-xs text-stone-500">No microphones found</div>
                        )}
                        {audioInputs.map((device, idx) => (
                          <DropdownMenuItem
                            key={device.deviceId || idx}
                            onSelect={async () => {
                              await switchAudioInput(device.deviceId)
                              setActiveAudioInputId(device.deviceId)
                            }}
                            className={cn(
                              "cursor-pointer text-sm",
                              activeAudioInputId === device.deviceId && "text-[#FF6A2E]"
                            )}
                          >
                            {device.label || `Microphone ${idx + 1}`}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Microphone settings</TooltipContent>
              </Tooltip>
              <span className="text-[11px] font-bold text-stone-400">Mic</span>
            </div>

            {/* Camera control */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleVideo}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white",
                      localState.videoEnabled ? "bg-[#16171B] hover:bg-[#202127]" : "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    {localState.videoEnabled ? <VideoIcon className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Camera settings</TooltipContent>
              </Tooltip>
              <span className="text-[11px] font-bold text-stone-400">Camera</span>
            </div>

            {/* Screen Share control */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleScreenShare}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white",
                      localState.screenSharing ? "bg-gradient-to-br from-[#FF6A2E] to-[#FF2E63]" : "bg-[#16171B] hover:bg-[#202127]"
                    )}
                  >
                    {localState.screenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-white" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Share screen</TooltipContent>
              </Tooltip>
              <span className="text-[11px] font-bold text-stone-400">Screen</span>
            </div>

            {/* Chat toggle */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => togglePanel("chat")}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white",
                      activePanel === "chat" ? "bg-[#FF6A2E]/25 text-[#FF6A2E]" : "bg-[#16171B] hover:bg-[#202127]"
                    )}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Toggle Chat panel</TooltipContent>
              </Tooltip>
              <span className="text-[11px] font-bold text-stone-400">Chat</span>
            </div>

            {/* Hand raise */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      toggleHandRaise()
                      toast.success(localState.handRaised ? "Hand lowered" : "Hand raised")
                    }}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white",
                      localState.handRaised ? "bg-amber-500 text-stone-950" : "bg-[#16171B] hover:bg-[#202127]"
                    )}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
                      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v9" />
                      <path d="M6 14.5V11a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7.5a6.5 6.5 0 0 0 13 0v-4" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{localState.handRaised ? "Lower Hand" : "Raise Hand"}</TooltipContent>
              </Tooltip>
              <span className="text-[11px] font-bold text-stone-400">Raise Hand</span>
            </div>

            {/* Rotated Hangup Button (Center anchor) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={onLeave} 
                  style={{ 
                    width: '68px', 
                    height: '68px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(150deg, #FF4A16, #E52603)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer', 
                    boxShadow: '0 8px 24px rgba(229,38,3,0.3)', 
                    border: 'none' 
                  }} 
                  className="hover:scale-105 active:scale-95 transition-all text-white shrink-0"
                >
                  <PhoneOff style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }} className="w-6 h-6 text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Leave conference</TooltipContent>
            </Tooltip>

            {/* Call Recording */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    disabled={!recorder.isSupported}
                    onClick={() => {
                      if (recorder.isRecording) {
                        recorder.stopRecording()
                        toast.info("Recording stopped — saving to Recordings")
                      } else {
                        recorder.startRecording()
                        toast.success("Recording started")
                      }
                    }}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white disabled:opacity-40 disabled:cursor-not-allowed",
                      recorder.isRecording ? "bg-red-600 animate-pulse text-white" : "bg-[#16171B] hover:bg-[#202127]"
                    )}
                  >
                    <Circle className={cn("w-5 h-5", recorder.isRecording ? "fill-white stroke-white" : "stroke-stone-400")} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {!recorder.isSupported
                    ? "Recording not supported in this browser"
                    : recorder.isRecording
                      ? `Stop recording (${Math.floor(recorder.elapsedSeconds / 60)}:${String(recorder.elapsedSeconds % 60).padStart(2, "0")})`
                      : "Record meeting"}
                </TooltipContent>
              </Tooltip>
              <span className="text-[11px] font-bold text-stone-400">Record</span>
            </div>

            {/* Reactions toggle */}
            <div className="flex flex-col items-center gap-2">
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button className="w-12 h-12 rounded-full bg-[#16171B] hover:bg-[#202127] flex items-center justify-center cursor-pointer text-white">
                        <Smile className="w-5 h-5 text-stone-400" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Send reactions</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="center" side="top" className="flex gap-1 p-2 rounded-2xl bg-[#111214] border border-white/5 w-auto">
                  {["👍", "❤️", "🔥", "🎉", "😂", "👏"].map((emoji) => (
                    <DropdownMenuItem
                      key={emoji}
                      onSelect={() => sendReaction(emoji)}
                      className="cursor-pointer text-2xl p-2 rounded-xl focus:bg-white/10 justify-center"
                    >
                      {emoji}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="text-[11px] font-bold text-stone-400">Reactions</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
