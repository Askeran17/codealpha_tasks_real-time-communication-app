import { useEffect, useState } from "react"
import { api, type AuthUser } from "@/lib/api"

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const currentUser = await api.getMe()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()

    const handleAuthChange = () => {
      checkAuth()
    }

    window.addEventListener("auth-changed", handleAuthChange)
    return () => window.removeEventListener("auth-changed", handleAuthChange)
  }, [])

  const signOut = async () => {
    await api.logout()
    setUser(null)
    window.dispatchEvent(new Event("auth-changed"))
  }

  return { user, loading, signOut }
}
