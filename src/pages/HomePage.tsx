import { useState, useEffect, useCallback } from "react"
import { api, type Room, type AuthUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Video, Plus, LogOut, Users, Clock, Trash2, ArrowRight, Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

type Props = {
  user: AuthUser
  onJoinRoom: (roomId: string) => void
  onSignOut: () => void
}

export default function HomePage({ user, onJoinRoom, onSignOut }: Props) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomDesc, setNewRoomDesc] = useState("")
  const { theme, setTheme } = useTheme()

  const displayName = user.user_metadata?.display_name || user.username || "User"

  const fetchRooms = useCallback(async () => {
    try {
      const data = await api.listRooms()
      setRooms(data)
    } catch {
      toast.error("Failed to load rooms")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
    
    // Poll for rooms list updates every 5 seconds
    const interval = setInterval(fetchRooms, 5000)
    return () => clearInterval(interval)
  }, [fetchRooms])

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return
    setCreating(true)
    try {
      const data = await api.createRoom(newRoomName.trim(), newRoomDesc.trim())
      toast.success("Room created!")
      setDialogOpen(false)
      setNewRoomName("")
      setNewRoomDesc("")
      onJoinRoom(data.id)
    } catch {
      toast.error("Failed to create room")
    } finally {
      setCreating(false)
    }
  }

  const deleteRoom = async (roomId: string) => {
    try {
      await api.deleteRoom(roomId)
      toast.success("Room deleted")
      fetchRooms()
    } catch {
      toast.error("Failed to delete room")
    }
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-background premium-bg">
      {/* Header */}
      <header className="border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-primary rounded-lg flex items-center justify-center shadow-sm">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">SyncSpace</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 text-foreground transition-all duration-300 relative overflow-hidden group cursor-pointer"
            >
              <Sun className="h-[1.1rem] w-[1.1rem] transition-all duration-500 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="absolute h-[1.1rem] w-[1.1rem] transition-all duration-500 rotate-90 scale-0 dark:rotate-0 dark:scale-100 text-indigo-400" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">{displayName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Meeting Rooms</h1>
            <p className="text-muted-foreground mt-1">Join an existing room or create a new one</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new room</DialogTitle>
                <DialogDescription>Set up a video conference room for your team</DialogDescription>
              </DialogHeader>
              <form onSubmit={createRoom}>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      placeholder="Weekly Standup"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room-desc">Description (optional)</Label>
                    <Input
                      id="room-desc"
                      placeholder="Brief description of this room"
                      value={newRoomDesc}
                      onChange={(e) => setNewRoomDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create & Join"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No rooms yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first meeting room to get started with video conferencing
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="group hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{room.name}</CardTitle>
                      {room.description && (
                        <CardDescription className="mt-1 text-xs line-clamp-2">
                          {room.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(room.created_at)}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 gap-2">
                  <Button size="sm" className="flex-1" onClick={() => onJoinRoom(room.id)}>
                    Join Room
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                  {String(room.created_by) === user.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                      onClick={() => deleteRoom(room.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
