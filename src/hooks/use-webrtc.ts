import { useEffect, useRef, useState, useCallback } from "react"
import { connectRoomSocket, closeRoomSocket, type AuthUser } from "@/lib/api"
import { toast } from "sonner"

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
}

export type RemotePeer = {
  userId: string
  displayName: string
  stream: MediaStream | null
  audioEnabled: boolean
  videoEnabled: boolean
  screenSharing: boolean
  handRaised: boolean
}

export type LocalState = {
  audioEnabled: boolean
  videoEnabled: boolean
  screenSharing: boolean
  handRaised: boolean
}

export type Reaction = {
  id: string
  userId: string
  displayName: string
  emoji: string
}

export function useWebRTC(roomId: string, user: AuthUser) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<Map<string, RemotePeer>>(new Map())
  const [localState, setLocalState] = useState<LocalState>({
    audioEnabled: true,
    videoEnabled: true,
    screenSharing: false,
    handRaised: false,
  })
  const [reactions, setReactions] = useState<Reaction[]>([])

  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const socketRef = useRef<WebSocket | null>(null)
  const displayName = user.user_metadata?.display_name || user.username || "User"

  // Ref to hold a sender function so callbacks can access it without re-binds
  const sendWSMessageRef = useRef<((type: string, payload: any, toUser?: string | null) => void) | null>(null)

  const getOrCreatePC = useCallback((remoteUserId: string): RTCPeerConnection => {
    if (peerConnectionsRef.current.has(remoteUserId)) {
      return peerConnectionsRef.current.get(remoteUserId)!
    }

    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWSMessageRef.current?.("ice-candidate", { candidate: event.candidate.toJSON() }, remoteUserId)
      }
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      setPeers((prev) => {
        const updated = new Map(prev)
        const existing = updated.get(remoteUserId)
        if (existing) {
          updated.set(remoteUserId, { ...existing, stream })
        }
        return updated
      })
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setPeers((prev) => {
          const updated = new Map(prev)
          updated.delete(remoteUserId)
          return updated
        })
        peerConnectionsRef.current.delete(remoteUserId)
      }
    }

    // Add local tracks to the peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    peerConnectionsRef.current.set(remoteUserId, pc)
    return pc
  }, [])

  const initLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      setLocalStream(stream)
      return stream
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        localStreamRef.current = stream
        setLocalStream(stream)
        toast.warning("Camera not available, audio only")
        return stream
      } catch {
        toast.error("Could not access microphone or camera")
        return null
      }
    }
  }, [])

  const sendOffer = useCallback(async (remoteUserId: string, remoteDisplayName: string) => {
    setPeers((prev) => {
      const updated = new Map(prev)
      if (!updated.has(remoteUserId)) {
        updated.set(remoteUserId, {
          userId: remoteUserId,
          displayName: remoteDisplayName,
          stream: null,
          audioEnabled: true,
          videoEnabled: true,
          screenSharing: false,
          handRaised: false,
        })
      }
      return updated
    })

    const pc = getOrCreatePC(remoteUserId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    sendWSMessageRef.current?.("offer", {
      sdp: offer,
      display_name: displayName,
    }, remoteUserId)
  }, [getOrCreatePC, displayName])

  useEffect(() => {
    let ws: WebSocket | null = null
    let cleanedUp = false

    const sendWSMessage = (type: string, payload: any, toUser: string | null = null) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type,
          room_id: roomId,
          from_user: user.id,
          to_user: toUser,
          display_name: displayName,
          payload
        }))
      }
    }
    sendWSMessageRef.current = sendWSMessage

    const init = async () => {
      await initLocalMedia()
      if (cleanedUp) return

      // Connect WebSocket
      ws = connectRoomSocket(
        roomId,
        async (msg) => {
          if (msg.from_user === user.id) return
          if (msg.to_user && msg.to_user !== user.id) return

          if (msg.type === "join") {
            const joinDisplayName = msg.payload.display_name || msg.display_name || "User"
            await sendOffer(msg.from_user, joinDisplayName)
          }

          else if (msg.type === "offer") {
            const remoteDisplayName = msg.payload.display_name || msg.display_name || "User"
            setPeers((prev) => {
              const updated = new Map(prev)
              if (!updated.has(msg.from_user)) {
                updated.set(msg.from_user, {
                  userId: msg.from_user,
                  displayName: remoteDisplayName,
                  stream: null,
                  audioEnabled: true,
                  videoEnabled: true,
                  screenSharing: false,
                  handRaised: false,
                })
              }
              return updated
            })

            const pc = getOrCreatePC(msg.from_user)
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            sendWSMessage("answer", { sdp: answer, display_name: displayName }, msg.from_user)
          }

          else if (msg.type === "answer") {
            const pc = peerConnectionsRef.current.get(msg.from_user)
            if (pc && pc.signalingState !== "stable") {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp))
            }
          }

          else if (msg.type === "ice-candidate") {
            const pc = peerConnectionsRef.current.get(msg.from_user)
            if (pc) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate))
              } catch { /* ignore stale candidates */ }
            }
          }

          else if (msg.type === "leave") {
            setPeers((prev) => {
              const updated = new Map(prev)
              updated.delete(msg.from_user)
              return updated
            })
            const pc = peerConnectionsRef.current.get(msg.from_user)
            if (pc) {
              pc.close()
              peerConnectionsRef.current.delete(msg.from_user)
            }
          }

          else if (msg.type === "media-state") {
            const state = msg.payload
            setPeers((prev) => {
              const updated = new Map(prev)
              const existing = updated.get(msg.from_user)
              if (existing) {
                updated.set(msg.from_user, { ...existing, ...state })
              }
              return updated
            })
          }

          else if (msg.type === "reaction") {
            const emoji = msg.payload?.emoji
            if (!emoji) return
            const reactionDisplayName = msg.payload.display_name || msg.display_name || "User"
            const id = `${msg.from_user}-${Date.now()}-${Math.random()}`
            setReactions((prev) => [...prev, { id, userId: msg.from_user, displayName: reactionDisplayName, emoji }])
            setTimeout(() => {
              setReactions((prev) => prev.filter((r) => r.id !== id))
            }, 3000)
          }
        },
        () => {
          console.log("WebSocket connection closed")
        }
      )
      socketRef.current = ws

      // Wait a tiny bit for socket to open, then announce join
      ws.onopen = () => {
        sendWSMessage("join", { display_name: displayName })
      }
    }

    init()

    return () => {
      cleanedUp = true
      
      // Announce leave and close
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "leave",
            room_id: roomId,
            from_user: user.id,
            to_user: null,
            payload: {}
          }))
        }
        closeRoomSocket(ws)
      }

      // Close all peer connections
      peerConnectionsRef.current.forEach((pc) => pc.close())
      peerConnectionsRef.current.clear()

      // Stop local media
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [roomId, user.id, displayName, initLocalMedia, getOrCreatePC, sendOffer])

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) return
    audioTrack.enabled = !audioTrack.enabled
    const newState = { ...localState, audioEnabled: audioTrack.enabled }
    setLocalState(newState)
    sendWSMessageRef.current?.("media-state", newState)
  }, [localState])

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return
    videoTrack.enabled = !videoTrack.enabled
    const newState = { ...localState, videoEnabled: videoTrack.enabled }
    setLocalState(newState)
    sendWSMessageRef.current?.("media-state", newState)
  }, [localState])

  const stopScreenShare = useCallback(async () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    screenStreamRef.current = null
    setScreenStream(null)

    const camStream = localStreamRef.current
    if (camStream) {
      const videoTrack = camStream.getVideoTracks()[0]
      if (videoTrack) {
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video")
          if (sender) sender.replaceTrack(videoTrack)
        })
      }
    }

    const newState = { ...localState, screenSharing: false }
    setLocalState(newState)
    sendWSMessageRef.current?.("media-state", newState)
  }, [localState])

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      screenStreamRef.current = stream
      setScreenStream(stream)

      const videoTrack = stream.getVideoTracks()[0]
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video")
        if (sender) sender.replaceTrack(videoTrack)
      })

      const newState = { ...localState, screenSharing: true }
      setLocalState(newState)
      sendWSMessageRef.current?.("media-state", newState)

      stream.getVideoTracks()[0].onended = () => stopScreenShare()
    } catch {
      toast.error("Could not start screen sharing")
    }
  }, [localState, stopScreenShare])

  const toggleHandRaise = useCallback(() => {
    const newState = { ...localState, handRaised: !localState.handRaised }
    setLocalState(newState)
    sendWSMessageRef.current?.("media-state", newState)
  }, [localState])

  const sendReaction = useCallback((emoji: string) => {
    const id = `${user.id}-${Date.now()}-${Math.random()}`
    setReactions((prev) => [...prev, { id, userId: user.id, displayName, emoji }])
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id))
    }, 3000)
    sendWSMessageRef.current?.("reaction", { emoji, display_name: displayName })
  }, [user.id, displayName])

  const switchAudioInput = useCallback(async (deviceId: string) => {
    const stream = localStreamRef.current
    if (!stream) return
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } })
      const newTrack = newStream.getAudioTracks()[0]
      if (!newTrack) return

      const oldTrack = stream.getAudioTracks()[0]
      if (oldTrack) {
        stream.removeTrack(oldTrack)
        oldTrack.stop()
      }
      stream.addTrack(newTrack)
      newTrack.enabled = localState.audioEnabled

      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "audio")
        if (sender) sender.replaceTrack(newTrack)
      })

      // Mutating the MediaStream in place doesn't change its reference, so
      // consumers relying on localStream in effect deps (e.g. the audio-level
      // meter) wouldn't re-run — publish a new MediaStream wrapping the same
      // tracks purely to signal the change.
      setLocalStream(new MediaStream(stream.getTracks()))
      toast.success("Microphone switched")
    } catch {
      toast.error("Could not switch microphone")
    }
  }, [localState.audioEnabled])

  return {
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
  }
}
