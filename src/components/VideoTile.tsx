import { useCallback, useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MicOff, VideoOff, Monitor } from "lucide-react"
import { cn, getAvatarColor } from "@/lib/utils"

// Below this average frequency-bin level (0-255), the mic is treated as
// background noise rather than speech, so the ring doesn't flicker on
// silence/room hiss.
const SPEAKING_THRESHOLD = 12

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
  // A callback ref (not useRef + useEffect) because the <video> element
  // unmounts/remounts whenever videoEnabled toggles (it's swapped for the
  // Avatar placeholder below). useEffect wouldn't rerun on that remount
  // since `stream` itself hasn't changed, leaving the new element's
  // srcObject unset — this fires on every mount instead.
  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && stream) {
        node.srcObject = stream
      }
    },
    [stream]
  )

  const [speaking, setSpeaking] = useState(false)
  const wasSpeakingRef = useRef(false)

  useEffect(() => {
    const audioTrack = stream?.getAudioTracks()[0]
    if (!audioTrack || !audioEnabled) {
      setSpeaking(false)
      return
    }

    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]))
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.6
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)

    let rafId: number
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length
      const isSpeaking = avg > SPEAKING_THRESHOLD
      if (isSpeaking !== wasSpeakingRef.current) {
        wasSpeakingRef.current = isSpeaking
        setSpeaking(isSpeaking)
      }
      rafId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafId)
      source.disconnect()
      audioContext.close()
    }
  }, [stream, audioEnabled])

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-muted flex items-center justify-center aspect-video transition-shadow duration-150",
        speaking && "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background",
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
            <AvatarFallback className={cn("text-xl text-white", getAvatarColor(displayName))}>
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
