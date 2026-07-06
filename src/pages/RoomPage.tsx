import { useEffect, useState } from "react"
import { api, type AuthUser, type Room } from "@/lib/api"
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
  Phone,
  Users,
  Shield,
  Link2,
  ChevronDown,
  X,
  Maximize2,
  Volume2,
  Smile,
  MoreHorizontal,
  MoreVertical,
  Hand,
  Pencil,
  Sun,
  Moon
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

type Props = {
  roomId: string
  user: AuthUser
  onLeave: () => void
}

type Panel = "chat" | "files" | "people" | "whiteboard" | null

export default function RoomPage({ roomId, user, onLeave }: Props) {
  const { theme, setTheme } = useTheme()
  const [activePanel, setActivePanel] = useState<Panel>("chat")
  const [room, setRoom] = useState<Room | null>(null)
  const [seconds, setSeconds] = useState(0) // Starting meeting timer from zero
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
    api.getRoom(roomId).then((data) => {
      if (!cancelled) setRoom(data)
    }).catch(() => {
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




  return (
    <div
      className="flex bg-[#0B0C0E] overflow-hidden text-white w-full select-none"
      style={{ height: "var(--room-vh, 100dvh)", fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <SettingsDialog user={user} open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Main Calling Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Topbar Header */}
        <header className="bg-[#111214]/65 backdrop-blur-md px-3 sm:px-6 h-16 sm:h-20 shrink-0 border-b border-white/5 flex items-center justify-between z-20">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <h2 className="text-sm sm:text-lg font-bold truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">{room?.name || "Meeting Room"}</h2>

            {/* LIVE indicator */}
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-red-600/10 text-red-500 border border-red-600/20 px-1.5 py-0.5 rounded-lg shrink-0">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="hidden xs:inline">LIVE</span>
            </span>

            {/* SECURE E2EE indicator */}
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-lg shrink-0">
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">SECURE</span>
            </span>

            {/* Duration display */}
            <span className="text-xs sm:text-sm font-semibold text-stone-400 font-mono tracking-wider shrink-0">
              {formatDuration()}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Dark Invite Pill */}
            <button
              onClick={handleCopyInviteLink}
              className="flex items-center gap-2 p-2 sm:py-2 sm:px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-stone-300 text-sm font-semibold transition-colors cursor-pointer"
              title="Copy invite link"
            >
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">Invite</span>
            </button>

            {/* Participants counter */}
            <div className="flex items-center gap-1 text-sm font-bold text-stone-300">
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-stone-400" />
              <span>{1 + peersArray.length}</span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl text-stone-300 hover:bg-white/5 cursor-pointer transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-400" />}
            </button>

            <div className="w-[1px] h-5 bg-white/10" />

            {/* Vertical menu dots */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-xl text-stone-300 hover:bg-white/5 cursor-pointer">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl bg-[#111214] border border-white/5 text-white">
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)} className="text-white hover:text-white cursor-pointer focus:bg-white/10 focus:text-white">Settings</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleCopyInviteLink} className="text-white hover:text-white cursor-pointer focus:bg-white/10 focus:text-white">Copy Invite Link</DropdownMenuItem>
                <DropdownMenuItem onSelect={onLeave} className="text-white hover:text-white cursor-pointer focus:bg-white/10 focus:text-white">Leave Conference</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile pic with status ring */}
            <div className="relative shrink-0">
              <Avatar className="w-[30px] h-[30px] sm:w-[36px] sm:h-[36px] border border-white/10">
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
        <div className="flex-1 flex overflow-hidden p-3 sm:p-6 gap-3 sm:gap-6 relative">

          {/* Main workspace layout: center display + bottom participant grid */}
          <div className="flex-1 flex flex-col gap-3 sm:gap-6 overflow-hidden">

            {/* Massive central active speaker display box */}
            <div className="flex-1 relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A1B20] via-[#2F1F17] to-[#131416] border border-white/5 bg-clip-padding flex flex-col items-center justify-center">

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
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover object-[center_35%] border border-white/10 shadow-lg shadow-black/35 mb-2 sm:mb-4"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#FF2E63] to-[#FF6A2E] flex items-center justify-center text-white text-xl sm:text-3xl font-extrabold shadow-lg shadow-red-500/20 mb-2 sm:mb-4 select-none">
                      {getInitials(displayName)}
                    </div>
                  )}
                  <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight">{displayName}</h3>
                  <span className="text-[10px] sm:text-xs font-bold text-stone-400 bg-white/5 py-0.5 px-2 sm:py-1 sm:px-3.5 rounded-full mt-1 sm:mt-2 select-none">
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
              <div className="flex gap-2 sm:gap-4 shrink-0 h-28 sm:h-40 overflow-x-auto pb-1 sm:pb-2 w-full">

                {/* Peers Cards */}
                {peersArray.map((peer) => {
                  const isSpotlighted = activePeer && activePeer.userId === peer.userId
                  return (
                    <div
                      key={peer.userId}
                      className={cn(
                        "relative w-40 sm:w-64 rounded-2xl overflow-hidden bg-[#16171B] border border-white/5 flex items-center justify-center shrink-0 group cursor-pointer transition-all",
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
                          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#FF2E63] to-[#FF6A2E] flex items-center justify-center text-white text-xs sm:text-base font-bold">
                            {getInitials(peer.displayName)}
                          </div>
                        </div>
                      )}
                      {/* Hand raised badge */}
                      {peer.handRaised && (
                        <div className="absolute top-2 left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center z-10 animate-bounce">
                          <Hand className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
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
                            className="text-white focus:text-white focus:bg-white/10 cursor-pointer"
                          >
                            {pinnedPeerId === peer.userId ? "Unpin" : "Pin to main view"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* Footer Mic tag */}
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2.5 sm:left-2.5 sm:right-2.5 flex items-center gap-1 py-0.5 px-1.5 sm:py-1 sm:px-2.5 bg-black/60 backdrop-blur-md rounded-md sm:rounded-lg z-10 w-fit">
                        {peer.audioEnabled ? (
                          <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                        ) : (
                          <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FF4A16]" />
                        )}
                        <span className="text-[9px] sm:text-[11px] font-bold text-white truncate max-w-[85px] sm:max-w-[130px]">
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
                "absolute inset-3 z-30 sm:relative sm:inset-auto flex-none h-[calc(100%-24px)] sm:h-full overflow-hidden flex flex-col bg-[#121214] border border-white/5 rounded-3xl shrink-0 w-auto sm:w-96 transition-all duration-300",
                activePanel === "whiteboard" && "sm:w-[450px]"
              )}
            >
              {/* Right Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#121214] shrink-0">
                <div className="flex items-center gap-4">
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
                  <ChatPanel roomId={roomId} user={user} mode="chat" onFileShared={() => setActivePanel("files")} />
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
        <div 
          className="shrink-0 h-16 sm:h-28 flex items-center justify-start sm:justify-center bg-[#0B0C0E] border-t border-white/5 z-20 select-none overflow-x-auto [&::-webkit-scrollbar]:hidden w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex items-center gap-1 sm:gap-2.5 md:gap-4 lg:gap-7 flex-nowrap shrink-0 px-4 sm:px-10 mx-auto">

            {/* Mic control */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "h-8 w-8 sm:w-auto sm:h-14 rounded-full flex items-center justify-center sm:pl-3.5 sm:pr-1.5 gap-0.5 sm:gap-1 border transition-all select-none",
                    localState.audioEnabled
                      ? "bg-white/5 hover:bg-white/10 border-white/5"
                      : "bg-red-600 hover:bg-red-700 border-transparent"
                  )}>
                    <button
                      onClick={toggleAudio}
                      className="h-8 w-8 sm:h-12 sm:w-10 flex items-center justify-center text-white transition-colors cursor-pointer"
                    >
                      {localState.audioEnabled ? <Mic className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-white" /> : <MicOff className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-white" />}
                    </button>
                    <DropdownMenu onOpenChange={(open) => { if (open) loadAudioInputs() }}>
                      <DropdownMenuTrigger asChild>
                        <button className="hidden sm:flex h-12 w-6 text-white/70 hover:text-white items-center justify-center cursor-pointer">
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
                              "text-white focus:text-white focus:bg-white/10 cursor-pointer text-sm",
                              activeAudioInputId === device.deviceId ? "text-[#FF6A2E] focus:text-[#FF6A2E]" : ""
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
              <span className="text-[12px] font-semibold text-stone-400/90 mt-1 hidden sm:block">Mic</span>
            </div>

            {/* Camera control */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleVideo}
                    className={cn(
                      "w-8 h-8 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white border",
                      localState.videoEnabled
                        ? "bg-white/5 hover:bg-white/10 border-white/5"
                        : "bg-red-600 hover:bg-red-700 border-transparent"
                    )}
                  >
                    {localState.videoEnabled ? <VideoIcon className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-white fill-white" /> : <VideoOff className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-white" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Camera settings</TooltipContent>
              </Tooltip>
              <span className="text-[12px] font-semibold text-stone-400/90 mt-1 hidden sm:block">Camera</span>
            </div>

            {/* Screen Share control */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleScreenShare}
                    className={cn(
                      "w-8 h-8 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white border",
                      localState.screenSharing
                        ? "bg-gradient-to-br from-[#FF6A2E] to-[#FF2E63] border-transparent"
                        : "bg-white/5 hover:bg-white/10 border-white/5"
                    )}
                  >
                    {localState.screenSharing ? <MonitorOff className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-white" /> : <Monitor className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-white" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Share screen</TooltipContent>
              </Tooltip>
              <span className="text-[12px] font-semibold text-stone-400/90 mt-1 hidden sm:block">Screen</span>
            </div>

            {/* Chat toggle */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => togglePanel("chat")}
                    className={cn(
                      "w-8 h-8 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white border",
                      activePanel === "chat"
                        ? "bg-gradient-to-br from-[#FF6A2E] to-[#FF2E63] border-transparent"
                        : "bg-white/5 hover:bg-white/10 border-white/5"
                    )}
                  >
                    <MessageSquare className="w-4 h-4 sm:w-[22px] sm:h-[22px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Toggle Chat panel</TooltipContent>
              </Tooltip>
              <span className="text-[12px] font-semibold text-stone-400/90 mt-1 hidden sm:block">Chat</span>
            </div>

            {/* Whiteboard toggle */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => togglePanel("whiteboard")}
                    className={cn(
                      "w-8 h-8 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white border",
                      activePanel === "whiteboard"
                        ? "bg-gradient-to-br from-[#FF6A2E] to-[#FF2E63] border-transparent"
                        : "bg-white/5 hover:bg-white/10 border-white/5"
                    )}
                  >
                    <Pencil className="w-4 h-4 sm:w-[22px] sm:h-[22px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Toggle Whiteboard panel</TooltipContent>
              </Tooltip>
              <span className="text-[12px] font-semibold text-stone-400/90 mt-1 hidden sm:block">Whiteboard</span>
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
                      "w-8 h-8 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white border",
                      localState.handRaised
                        ? "bg-amber-500 text-stone-950 border-transparent"
                        : "bg-white/5 hover:bg-white/10 border-white/5"
                    )}
                  >
                    <Hand className="w-4 h-4 sm:w-[22px] sm:h-[22px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{localState.handRaised ? "Lower Hand" : "Raise Hand"}</TooltipContent>
              </Tooltip>
              <span className="text-[12px] font-semibold text-stone-400/90 mt-1 hidden sm:block">Raise Hand</span>
            </div>

            {/* Rotated Hangup Button (Center anchor) */}
            <div className="flex flex-col items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onLeave}
                    className="w-9 h-9 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[#FF4A16] to-[#E52603] flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all text-white shrink-0 shadow-lg shadow-[#E52603]/30 border-none"
                  >
                    <Phone style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }} className="w-4.5 h-4.5 sm:w-7 sm:h-7 text-white fill-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Leave conference</TooltipContent>
              </Tooltip>
            </div>

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
                      "w-8 h-8 sm:w-14 sm:h-14 rounded-full flex items-center justify-center cursor-pointer transition-colors text-white disabled:opacity-40 disabled:cursor-not-allowed border",
                      recorder.isRecording
                        ? "bg-red-600 animate-pulse text-white border-transparent"
                        : "bg-white/5 hover:bg-white/10 border-white/5"
                    )}
                  >
                    <svg className="w-4 h-4 sm:w-[22px] sm:h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
                    </svg>
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
              <span className="text-[12px] font-semibold text-stone-400/90 mt-1 hidden sm:block">Record</span>
            </div>

            {/* Reactions toggle */}
            <div className="flex flex-col items-center gap-2">
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center cursor-pointer text-white">
                        <Smile className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-white" />
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
              <span className="text-[12px] font-semibold text-stone-400/90 mt-1 hidden sm:block">Reactions</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
