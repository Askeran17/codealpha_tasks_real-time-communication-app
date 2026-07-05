import { useCallback, useRef, useState } from "react"
import type { RemotePeer } from "@/hooks/use-webrtc"
import { deriveKey, encryptFile } from "@/lib/crypto"
import { api } from "@/lib/api"
import { toast } from "sonner"

const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720
const FPS = 24
const MAX_TILES = 4

type Participant = {
  id: string
  displayName: string
  stream: MediaStream
}

export function isRecordingSupported(): boolean {
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function"
  )
}

function pickMimeType(): string {
  const candidates = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"]
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type
  }
  return "video/webm"
}

/**
 * Records the call by compositing local + remote video tiles onto an
 * offscreen canvas and mixing every participant's audio into one track —
 * MediaRecorder captures that combined stream. Nothing here touches the
 * WebRTC peer connections; it only reads the already-decoded streams that
 * use-webrtc exposes.
 */
export function useCallRecorder(
  localStream: MediaStream | null,
  screenStream: MediaStream | null,
  peers: Map<string, RemotePeer>,
  roomId: string,
  displayName: string
) {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const isSupported = isRecordingSupported()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawRafRef = useRef<number | null>(null)
  const lastDrawRef = useRef(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const combinedStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const audioSourcesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map())
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const participantsRef = useRef<Map<string, Participant>>(new Map())

  // Refs mirror the latest hook args so the running draw loop / audio graph
  // read live streams without the recorder itself being restarted.
  const localStreamRef = useRef(localStream)
  localStreamRef.current = localStream
  const screenStreamRef = useRef(screenStream)
  screenStreamRef.current = screenStream
  const peersRef = useRef(peers)
  peersRef.current = peers
  const displayNameRef = useRef(displayName)
  displayNameRef.current = displayName

  const disconnectAudio = (id: string) => {
    const source = audioSourcesRef.current.get(id)
    if (source) {
      try { source.disconnect() } catch { /* already disconnected */ }
      audioSourcesRef.current.delete(id)
    }
  }

  const connectAudio = (id: string, stream: MediaStream) => {
    if (!audioContextRef.current || !destinationRef.current) return
    if (audioSourcesRef.current.has(id)) return
    if (stream.getAudioTracks().length === 0) return
    try {
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(destinationRef.current)
      audioSourcesRef.current.set(id, source)
    } catch { /* stream not ready yet, will retry next sync */ }
  }

  const getOrCreateVideoEl = (id: string, stream: MediaStream): HTMLVideoElement => {
    let el = videoElsRef.current.get(id)
    if (!el) {
      el = document.createElement("video")
      el.muted = true
      el.playsInline = true
      videoElsRef.current.set(id, el)
    }
    if (el.srcObject !== stream) {
      el.srcObject = stream
      el.play().catch(() => {})
    }
    return el
  }

  // Diffs the live participant set against what the recorder currently
  // tracks so a peer joining/leaving mid-recording only updates the draw
  // list and audio graph — the MediaRecorder instance keeps running.
  const syncParticipants = () => {
    const active = new Map<string, Participant>()
    const localOrScreen = screenStreamRef.current || localStreamRef.current
    if (localOrScreen) active.set("local", { id: "local", displayName: displayNameRef.current, stream: localOrScreen })
    peersRef.current.forEach((peer, id) => {
      if (peer.stream) active.set(id, { id, displayName: peer.displayName, stream: peer.stream })
    })

    participantsRef.current.forEach((_, id) => {
      if (!active.has(id)) {
        disconnectAudio(id)
        const el = videoElsRef.current.get(id)
        if (el) {
          el.srcObject = null
          videoElsRef.current.delete(id)
        }
      }
    })

    active.forEach((participant, id) => {
      getOrCreateVideoEl(id, participant.stream)
      connectAudio(id, participant.stream)
    })

    participantsRef.current = active
  }

  const drawFrame = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#141312"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const tiles = Array.from(participantsRef.current.values()).slice(0, MAX_TILES)
    if (tiles.length === 0) return

    const cols = tiles.length <= 1 ? 1 : 2
    const rows = Math.ceil(tiles.length / cols)
    const cellW = CANVAS_WIDTH / cols
    const cellH = CANVAS_HEIGHT / rows

    tiles.forEach((tile, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x = col * cellW
      const y = row * cellH
      const el = videoElsRef.current.get(tile.id)

      if (el && el.videoWidth > 0) {
        const videoRatio = el.videoWidth / el.videoHeight
        const cellRatio = cellW / cellH
        let drawW = cellW
        let drawH = cellH
        if (videoRatio > cellRatio) {
          drawH = cellW / videoRatio
        } else {
          drawW = cellH * videoRatio
        }
        ctx.drawImage(el, x + (cellW - drawW) / 2, y + (cellH - drawH) / 2, drawW, drawH)
      } else {
        ctx.fillStyle = "#1D1B19"
        ctx.fillRect(x, y, cellW, cellH)
      }

      ctx.font = "14px sans-serif"
      const labelWidth = Math.min(cellW - 16, ctx.measureText(tile.displayName).width + 16)
      ctx.fillStyle = "rgba(0,0,0,0.55)"
      ctx.fillRect(x + 8, y + cellH - 32, labelWidth, 24)
      ctx.fillStyle = "#ffffff"
      ctx.fillText(tile.displayName, x + 16, y + cellH - 15)
    })
  }

  const startDrawLoop = () => {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const frameInterval = 1000 / FPS

    const loop = (timestamp: number) => {
      if (timestamp - lastDrawRef.current >= frameInterval) {
        lastDrawRef.current = timestamp
        syncParticipants()
        drawFrame(ctx)
      }
      drawRafRef.current = requestAnimationFrame(loop)
    }
    drawRafRef.current = requestAnimationFrame(loop)
  }

  const stopDrawLoop = () => {
    if (drawRafRef.current !== null) {
      cancelAnimationFrame(drawRafRef.current)
      drawRafRef.current = null
    }
  }

  const uploadRecording = useCallback(async (blob: Blob, mimeType: string, durationSeconds: number) => {
    const loadingToast = toast.loading("Encrypting and uploading recording...")
    try {
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: mimeType })
      const key = await deriveKey(roomId)
      const { encryptedBlob, iv } = await encryptFile(file, key)
      await api.uploadRecording(
        roomId,
        encryptedBlob,
        `Recording - ${new Date().toLocaleString()}`,
        file.size,
        mimeType,
        iv,
        durationSeconds
      )
      toast.dismiss(loadingToast)
      toast.success("Recording saved to Recordings")
    } catch {
      toast.dismiss(loadingToast)
      toast.error("Failed to save recording")
    }
  }, [roomId])

  const startRecording = useCallback(async () => {
    if (!isSupported || isRecording) return

    const canvas = document.createElement("canvas")
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    canvasRef.current = canvas

    const audioContext = new AudioContext()
    await audioContext.resume()
    audioContextRef.current = audioContext
    destinationRef.current = audioContext.createMediaStreamDestination()

    audioSourcesRef.current.clear()
    videoElsRef.current.clear()
    participantsRef.current = new Map()

    lastDrawRef.current = 0
    startDrawLoop()

    const canvasStream = canvas.captureStream(FPS)
    const combined = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...destinationRef.current.stream.getAudioTracks(),
    ])
    combinedStreamRef.current = combined

    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 2_500_000 })
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.start(1000)
    mediaRecorderRef.current = recorder

    setElapsedSeconds(0)
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    setIsRecording(true)
  }, [isSupported, isRecording])

  const cleanup = () => {
    stopDrawLoop()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    audioSourcesRef.current.forEach((source) => {
      try { source.disconnect() } catch { /* already disconnected */ }
    })
    audioSourcesRef.current.clear()
    videoElsRef.current.forEach((el) => { el.srcObject = null })
    videoElsRef.current.clear()
    combinedStreamRef.current?.getTracks().forEach((t) => t.stop())
    combinedStreamRef.current = null
    audioContextRef.current?.close().catch(() => {})
    audioContextRef.current = null
    destinationRef.current = null
    canvasRef.current = null
  }

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    const mimeType = recorder.mimeType
    const finalDuration = elapsedSeconds

    recorder.onstop = () => {
      cleanup()
      const blob = new Blob(chunksRef.current, { type: mimeType })
      chunksRef.current = []
      mediaRecorderRef.current = null
      setIsRecording(false)
      uploadRecording(blob, mimeType, finalDuration)
    }

    recorder.stop()
  }, [elapsedSeconds, uploadRecording])

  return { isRecording, isSupported, startRecording, stopRecording, elapsedSeconds }
}
