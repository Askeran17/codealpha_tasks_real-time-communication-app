import { useEffect, useState } from "react"
import { Toaster } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import AuthPage from "@/pages/AuthPage"
import HomePage from "@/pages/HomePage"
import RoomPage from "@/pages/RoomPage"
import { Spinner } from "@/components/ui/spinner"

// Rooms are joined by ID/invite link (like Zoom/Meet), not picked from a
// public list, so the room ID lives in the URL — this lets a shared link
// (e.g. https://host/room/<id>) deep-link straight into a room.
function getRoomIdFromPath(): string | null {
  const match = window.location.pathname.match(/^\/room\/([^/]+)\/?$/)
  return match ? match[1] : null
}

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [activeRoomId, setActiveRoomId] = useState<string | null>(getRoomIdFromPath)

  useEffect(() => {
    const handlePopState = () => setActiveRoomId(getRoomIdFromPath())
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const joinRoom = (id: string) => {
    window.history.pushState(null, "", `/room/${id}`)
    setActiveRoomId(id)
  }

  const leaveRoom = () => {
    window.history.pushState(null, "", "/")
    setActiveRoomId(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster richColors position="top-right" />
      </>
    )
  }

  if (activeRoomId) {
    return (
      <>
        <RoomPage
          roomId={activeRoomId}
          user={user}
          onLeave={leaveRoom}
        />
        <Toaster richColors position="top-right" />
      </>
    )
  }

  return (
    <>
      <HomePage
        user={user}
        onJoinRoom={joinRoom}
        onSignOut={signOut}
      />
      <Toaster richColors position="top-right" />
    </>
  )
}
