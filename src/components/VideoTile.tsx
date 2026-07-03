import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MicOff, VideoOff, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  stream: MediaStream | null
  displayName: string
  audioEnabled?: boolean
  videoEnabled?: boolean
  screenSharing?: boolean
  isLocal?: boolean
  className?: string
}

export default function VideoTile({
  stream,
  displayName,
  audioEnabled = true,
  videoEnabled = true,
  screenSharing = false,
  isLocal = false,
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-muted flex items-center justify-center aspect-video",
        className
      )}
    >
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-muted-foreground">{displayName}</span>
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
        <span className="text-xs font-medium text-white truncate">
          {displayName}
          {isLocal && " (You)"}
        </span>
        <div className="flex items-center gap-1">
          {screenSharing && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-blue-500 text-white border-0">
              <Monitor className="w-3 h-3 mr-0.5" />
              Screen
            </Badge>
          )}
          {!audioEnabled && (
            <div className="w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
          {!videoEnabled && (
            <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center">
              <VideoOff className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
