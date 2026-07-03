import { useState } from "react"
import { Toaster } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import AuthPage from "@/pages/AuthPage"
import HomePage from "@/pages/HomePage"
import RoomPage from "@/pages/RoomPage"
import { Spinner } from "@/components/ui/spinner"

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

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
          onLeave={() => setActiveRoomId(null)}
        />
        <Toaster richColors position="top-right" />
      </>
    )
  }

  return (
    <>
      <HomePage
        user={user}
        onJoinRoom={(id) => setActiveRoomId(id)}
        onSignOut={signOut}
      />
      <Toaster richColors position="top-right" />
    </>
  )
}
