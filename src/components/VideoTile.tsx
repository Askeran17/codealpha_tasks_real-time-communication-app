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

      {/* Bottom-left overlay pill matching the mockup exactly */}
      <div 
        style={{ 
          position: 'absolute', 
          left: '10px', 
          bottom: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '7px', 
          backgroundColor: 'rgba(12,13,15,0.72)', 
          borderRadius: '6px', 
          padding: '5px 10px',
          zIndex: 10 
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={audioEnabled ? '#39D26A' : '#F45B3B'} strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
        <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          {displayName}
          {isLocal && " (You)"}
        </span>
      </div>
    </div>
  )
}
