import { useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Video, Shield, Users, Monitor } from "lucide-react"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Use email as the username for Django login
      await api.login(email, password)
      toast.success("Signed in successfully!")
      window.dispatchEvent(new Event("auth-changed"))
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error("Display name is required")
      return
    }
    setLoading(true)
    try {
      // Register with email as both username and email
      await api.register(email, password, email, displayName.trim())
      toast.success("Account created and signed in!")
      window.dispatchEvent(new Event("auth-changed"))
    } catch (error: any) {
      toast.error(error.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex premium-bg">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-primary to-violet-800 flex-col justify-center px-16 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-foreground rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">SyncSpace</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground mb-4">
            Connect, collaborate, create.
          </h1>
          <p className="text-lg text-primary-foreground/70 leading-relaxed">
            End-to-end encrypted video conferencing with screen sharing, real-time whiteboard, and seamless file sharing.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Video, label: "HD Video Calls", desc: "Multi-user WebRTC" },
            { icon: Monitor, label: "Screen Share", desc: "Share any window" },
            { icon: Users, label: "Collaboration", desc: "Live whiteboard" },
            { icon: Shield, label: "Encrypted", desc: "DTLS/SRTP/AES-GCM secured" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-primary-foreground/10 rounded-xl p-4">
              <Icon className="w-5 h-5 text-primary-foreground mb-2" />
              <div className="text-sm font-semibold text-primary-foreground">{label}</div>
              <div className="text-xs text-primary-foreground/60">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-primary to-violet-800 rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SyncSpace</span>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Sign in to your SyncSpace account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Join SyncSpace for free</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Display Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Jane Smith"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
