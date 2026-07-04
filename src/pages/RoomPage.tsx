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

  return (
    <div className="h-screen flex flex-col bg-background premium-bg overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-card/85 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-gradient-to-br from-ember to-flare rounded-lg flex items-center justify-center shadow-sm shadow-flare/25">
            <Video className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold">Real-time app</span>
            <span className="text-muted-foreground text-xs ml-2">Room: {roomId.slice(0, 8)}…</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2.5 text-xs"
                onClick={handleCopyInviteLink}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy invite link</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span className="hidden sm:block">Encrypted</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{totalParticipants}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Video area */}
          <div className={cn("flex-1 overflow-hidden", activePanel && "hidden sm:block")}>
            <div className={cn("h-full grid gap-2 p-3 overflow-auto content-start", gridCols)}>
              {/* Local video */}
              <VideoTile
                stream={localState.screenSharing ? screenStream : localStream}
                displayName={displayName}
                audioEnabled={localState.audioEnabled}
                videoEnabled={localState.videoEnabled || localState.screenSharing}
                screenSharing={localState.screenSharing}
                isLocal
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
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/85 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                  {activePanel === "chat" ? (
                    <>
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Chat & Files</span>
                    </>
                  ) : (
                    <>
                      <PenLine className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Whiteboard</span>
                      <Badge className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">Live</Badge>
                    </>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground"
                  onClick={() => setActivePanel(null)}
                >
                  ×
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
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
        <div className="shrink-0 flex flex-wrap items-center justify-center gap-2 px-4 py-3 border-t border-border bg-card/85 backdrop-blur-md">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={localState.audioEnabled ? "outline" : "destructive"}
                className="h-10 w-10 p-0 rounded-full"
                onClick={toggleAudio}
              >
                {localState.audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{localState.audioEnabled ? "Mute" : "Unmute"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={localState.videoEnabled ? "outline" : "destructive"}
                className="h-10 w-10 p-0 rounded-full"
                onClick={toggleVideo}
              >
                {localState.videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{localState.videoEnabled ? "Stop Video" : "Start Video"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={localState.screenSharing ? "default" : "outline"}
                className="h-10 w-10 p-0 rounded-full"
                onClick={handleScreenShare}
              >
                {localState.screenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{localState.screenSharing ? "Stop Sharing" : "Share Screen"}</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activePanel === "chat" ? "default" : "outline"}
                className="h-10 w-10 p-0 rounded-full relative"
                onClick={() => togglePanel("chat")}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat & Files</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={activePanel === "whiteboard" ? "default" : "outline"}
                className="h-10 w-10 p-0 rounded-full"
                onClick={() => togglePanel("whiteboard")}
              >
                <PenLine className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Whiteboard</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="h-10 px-4 rounded-full"
                onClick={onLeave}
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                Leave
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave Room</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
