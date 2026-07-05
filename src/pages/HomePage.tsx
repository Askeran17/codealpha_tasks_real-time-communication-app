import { useState, useEffect, useCallback } from "react"
import { api, type Room, type AuthUser, type DjangoUser, type ScheduledMeeting, type Recording } from "@/lib/api"
import { deriveKey, decryptFile } from "@/lib/crypto"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  LayoutDashboard, Video, Calendar, Disc, Users, Settings, Crown, Search,
  ChevronDown, ChevronRight, Plus, Link2, ArrowRight, Clock, Trash2,
  Monitor, LogOut, Sun, Moon, Menu, X, Download, Play, Pin
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import SettingsDialog from "@/components/SettingsDialog"
import { cn } from "@/lib/utils"

type Props = {
  user: AuthUser
  onJoinRoom: (roomId: string) => void
  onSignOut: () => void
}

// Accepts either a raw room ID or a full invite link
function extractRoomId(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/\/room\/([^/?#]+)/)
  return match ? match[1] : trimmed
}

export default function HomePage({ user, onJoinRoom, onSignOut }: Props) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomDesc, setNewRoomDesc] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [joinInput, setJoinInput] = useState("")
  const [joining, setJoining] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem(`user-avatar-${user.id}`) || "")

  useEffect(() => {
    const handleAuthChanged = () => {
      setUserAvatar(localStorage.getItem(`user-avatar-${user.id}`) || "")
    }
    window.addEventListener("auth-changed", handleAuthChanged)
    handleAuthChanged()
    return () => window.removeEventListener("auth-changed", handleAuthChanged)
  }, [user.id])

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

  const joinByLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const roomId = extractRoomId(joinInput)
    if (!roomId) return
    setJoining(true)
    try {
      await api.getRoom(roomId)
      setJoinInput("")
      onJoinRoom(roomId)
    } catch {
      toast.error("Room not found — check the link or ID")
    } finally {
      setJoining(false)
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

  const togglePinRoom = async (room: Room) => {
    try {
      await api.togglePinRoom(room.id, !room.pinned)
      toast.success(room.pinned ? "Unpinned from dashboard" : "Pinned to dashboard")
      fetchRooms()
    } catch {
      toast.error("Failed to update pin")
    }
  }

  // Quick Action Utilities
  const startInstantMeeting = async () => {
    const randomNum = Math.floor(Math.random() * 900) + 100
    const name = `Instant Meeting #${randomNum}`
    const loadingToast = toast.loading("Creating instant meeting...")
    try {
      const data = await api.createRoom(name, "Quick action screen share / audio call")
      toast.dismiss(loadingToast)
      toast.success("Meeting started!")
      onJoinRoom(data.id)
    } catch {
      toast.dismiss(loadingToast)
      toast.error("Failed to create instant meeting")
    }
  }

  const copyInviteLink = () => {
    const dummyUrl = `${window.location.origin}/room/invite-link-demo`
    navigator.clipboard.writeText(dummyUrl)
    toast.success("Demo invite link copied to clipboard!")
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  // Filter local database rooms by topbar query
  const filteredUserRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const pinnedRooms = rooms.filter(room => room.pinned)
  const cardThemes = [
    {
      cardBg: "from-[#FFF6F6] to-[#FFF1F1] dark:from-[#251B18] dark:to-[#1F1816]",
      cardBorder: "border-[#FFE2E2] dark:border-[#382620]",
      blob1: "bg-[#FFD6D6]/45 dark:bg-[#3E211A]/40",
      blob2: "bg-[#FFE2E2]/65 dark:bg-[#4D271D]/30",
      pillBg: "bg-[#FFEBEB] dark:bg-[#3D1E1E] text-[#EF4444]",
      divider: "border-[#FFE2E2]/60 dark:border-[#382620]/60",
      button: "border border-[#FF6A2E]/30 text-[#FF6A2E] dark:text-[#F37338] bg-white/70 dark:bg-stone-900/60 hover:bg-[#FF6A2E] hover:text-white dark:hover:bg-[#F37338] dark:hover:text-stone-950",
    },
    {
      cardBg: "from-[#F6F4FF] to-[#EFF0FE] dark:from-[#1A1A2B] dark:to-[#171626]",
      cardBorder: "border-[#E0DCFE] dark:border-[#2B294A]",
      blob1: "bg-[#E5E0FF]/45 dark:bg-[#252144]/40",
      blob2: "bg-[#ECE9FF]/65 dark:bg-[#2F295B]/30",
      pillBg: "bg-[#F0EDFF] dark:bg-[#2B244D] text-[#6366F1]",
      divider: "border-[#E0DCFE]/60 dark:border-[#2D2A4A]/60",
      button: "bg-[#6366F1] hover:bg-[#4F46E5] text-white",
    },
  ]

  const [currentTab, setCurrentTab] = useState<"dashboard" | "rooms" | "calendar" | "recordings" | "contacts">("dashboard")

  // Contacts state
  const [contacts, setContacts] = useState<DjangoUser[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactSearch, setContactSearch] = useState("")

  const fetchContacts = useCallback(async (search?: string) => {
    setContactsLoading(true)
    try {
      const data = await api.listUsers(search)
      setContacts(data)
    } catch {
      toast.error("Failed to load contacts")
    } finally {
      setContactsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentTab === "contacts") fetchContacts(contactSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab])

  const callContact = async (contact: DjangoUser) => {
    const loadingToast = toast.loading(`Starting a call with ${contact.first_name || contact.username}...`)
    try {
      const room = await api.createRoom(`Call with ${contact.first_name || contact.username}`, "")
      toast.dismiss(loadingToast)
      const inviteUrl = `${window.location.origin}/room/${room.id}`
      navigator.clipboard.writeText(inviteUrl).catch(() => {})
      toast.success("Room created — invite link copied to clipboard!")
      onJoinRoom(room.id)
    } catch {
      toast.dismiss(loadingToast)
      toast.error("Failed to start call")
    }
  }

  // Calendar / scheduled meetings state
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([])
  const [meetingsLoading, setMeetingsLoading] = useState(false)
  const scheduledRoomIds = new Set(meetings.map(m => m.room_id))
  const scheduledCount = rooms.filter(r => scheduledRoomIds.has(r.id)).length
  const instantCount = rooms.length - scheduledCount
  const upcomingMeetings = meetings
    .filter(m => new Date(m.scheduled_at) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const [meetingDialogDate, setMeetingDialogDate] = useState<Date | null>(null)
  const [meetingTitle, setMeetingTitle] = useState("")
  const [meetingDesc, setMeetingDesc] = useState("")
  const [meetingTime, setMeetingTime] = useState("10:00")
  const [meetingDuration, setMeetingDuration] = useState(60)
  const [creatingMeeting, setCreatingMeeting] = useState(false)

  const fetchMeetings = useCallback(async () => {
    setMeetingsLoading(true)
    try {
      const data = await api.listMeetings()
      setMeetings(data)
    } catch {
      toast.error("Failed to load calendar")
    } finally {
      setMeetingsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentTab === "calendar" || currentTab === "dashboard") fetchMeetings()
  }, [currentTab, fetchMeetings])

  const meetingColors = [
    { bg: "bg-[#FFF5F5] dark:bg-[#3B221B]", text: "text-[#FF6A2E] dark:text-[#F37338]" },
    { bg: "bg-[#F5F3FF] dark:bg-[#281D3E]", text: "text-[#7C3AED] dark:text-[#A78BFA]" },
    { bg: "bg-[#EFF6FF] dark:bg-[#1E293B]", text: "text-[#3B82F6] dark:text-[#60A5FA]" },
    { bg: "bg-[#FFF7ED] dark:bg-[#3B2519]", text: "text-[#F97316] dark:text-[#FDBA74]" },
  ]

  const hashToIndex = (id: string, mod: number) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
    return hash % mod
  }

  const openNewMeetingDialog = (date: Date) => {
    setMeetingDialogDate(date)
    setMeetingTitle("")
    setMeetingDesc("")
    setMeetingTime("10:00")
    setMeetingDuration(60)
    setMeetingDialogOpen(true)
  }

  const submitNewMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingTitle.trim() || !meetingDialogDate) return
    setCreatingMeeting(true)
    try {
      const [hours, minutes] = meetingTime.split(":").map(Number)
      const scheduledAt = new Date(meetingDialogDate)
      scheduledAt.setHours(hours || 0, minutes || 0, 0, 0)
      await api.createMeeting(meetingTitle.trim(), meetingDesc.trim(), scheduledAt.toISOString(), meetingDuration)
      toast.success("Meeting scheduled!")
      setMeetingDialogOpen(false)
      fetchMeetings()
      fetchRooms()
    } catch {
      toast.error("Failed to schedule meeting")
    } finally {
      setCreatingMeeting(false)
    }
  }

  const cancelMeeting = async (meetingId: string) => {
    try {
      await api.deleteMeeting(meetingId)
      toast.success("Meeting cancelled")
      fetchMeetings()
      fetchRooms()
    } catch {
      toast.error("Failed to cancel meeting")
    }
  }

  const meetingsByDay = new Map<string, ScheduledMeeting[]>()
  for (const meeting of meetings) {
    const d = new Date(meeting.scheduled_at)
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      const key = String(d.getDate())
      const list = meetingsByDay.get(key) || []
      list.push(meeting)
      meetingsByDay.set(key, list)
    }
  }

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstWeekday = new Date(currentYear, currentMonth, 1).getDay()
  const isCurrentRealMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth()

  // Recordings state
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [recordingsLoading, setRecordingsLoading] = useState(false)
  const [playbackRecording, setPlaybackRecording] = useState<Recording | null>(null)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [playbackLoading, setPlaybackLoading] = useState(false)

  const fetchRecordings = useCallback(async () => {
    setRecordingsLoading(true)
    try {
      const data = await api.listAllRecordings()
      setRecordings(data)
    } catch {
      toast.error("Failed to load recordings")
    } finally {
      setRecordingsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentTab === "recordings") fetchRecordings()
  }, [currentTab, fetchRecordings])

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    const pad = (n: number) => String(n).padStart(2, "0")
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  const decryptRecordingToUrl = async (recording: Recording): Promise<string | null> => {
    try {
      const encryptedBlob = await api.downloadRecording(recording.file_url)
      const key = await deriveKey(recording.room_id)
      const decryptedBlob = await decryptFile(encryptedBlob, recording.iv || "", recording.mime_type, key)
      return URL.createObjectURL(decryptedBlob)
    } catch {
      toast.error("Failed to decrypt recording")
      return null
    }
  }

  const watchRecording = async (recording: Recording) => {
    setPlaybackRecording(recording)
    setPlaybackLoading(true)
    const url = await decryptRecordingToUrl(recording)
    setPlaybackUrl(url)
    setPlaybackLoading(false)
  }

  const closePlayback = () => {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl)
    setPlaybackRecording(null)
    setPlaybackUrl(null)
  }

  const downloadRecording = async (recording: Recording) => {
    const loadingToast = toast.loading("Decrypting recording...")
    const url = await decryptRecordingToUrl(recording)
    toast.dismiss(loadingToast)
    if (!url) return
    const a = document.createElement("a")
    a.href = url
    a.download = `${recording.display_name || "recording"}.webm`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Recording downloaded")
  }

  const deleteRecording = async (recording: Recording) => {
    try {
      await api.deleteRecording(recording.id)
      setRecordings((prev) => prev.filter((r) => r.id !== recording.id))
      toast.success("Recording deleted")
    } catch {
      toast.error("Failed to delete recording")
    }
  }

  // Navigation Links definition
  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, active: currentTab === "dashboard", onClick: () => setCurrentTab("dashboard") },
    { name: "Meeting Rooms", icon: Video, active: currentTab === "rooms", onClick: () => setCurrentTab("rooms") },
    { name: "Calendar", icon: Calendar, active: currentTab === "calendar", onClick: () => setCurrentTab("calendar") },
    { name: "Recordings", icon: Disc, active: currentTab === "recordings", onClick: () => setCurrentTab("recordings") },
    { name: "Contacts", icon: Users, active: currentTab === "contacts", onClick: () => setCurrentTab("contacts") },
    { name: "Settings", icon: Settings, active: false, onClick: () => setSettingsOpen(true) },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Brand logo */}
      <div>
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF6A2E] to-[#FF2E63] rounded-xl flex items-center justify-center shadow-md shadow-red-500/10">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-stone-900 dark:text-white font-extrabold">Meet</span>
            <span className="text-[#FF6A2E] font-black">Flow</span>
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={item.onClick || undefined}
                className={cn(
                  "w-full flex items-center gap-3.5 px-3 py-3 text-[15px] font-medium rounded-xl transition-all duration-200 cursor-pointer text-left",
                  item.active 
                    ? "bg-[#FFF5F5] text-[#FF6A2E] dark:bg-[#3A2A1E]/80 dark:text-[#F37338]" 
                    : "text-[#696969] hover:bg-stone-50 hover:text-stone-900 dark:text-[#A8A29A] dark:hover:bg-[#262421]/60 dark:hover:text-white"
                )}
              >
                <Icon className={cn("w-[21px] h-[21px]", item.active ? "text-[#FF6A2E] dark:text-[#F37338]" : "text-stone-400 dark:text-stone-500")} />
                {item.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Upgrade to Pro Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#FFEBEB] via-[#F6EEFF] to-[#EBE9FE] dark:from-[#35252b] dark:to-[#1e1d35] border border-red-100/50 dark:border-white/5 p-5 rounded-2xl">
        {/* Soft background glow circles */}
        <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-[#FF6A2E]/20 blur-md pointer-events-none"></div>
        <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-[#8B5CF6]/20 blur-md pointer-events-none"></div>
        
        <div className="w-9 h-9 bg-white dark:bg-stone-950 rounded-lg shadow-sm flex items-center justify-center mb-4">
          <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
        </div>
        <h3 className="text-base font-bold text-stone-900 dark:text-white mb-1.5">Upgrade to Pro</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
          Unlock premium features and boost your productivity.
        </p>
        <button 
          onClick={() => toast.info("Premium plans are currently invitation-only.")}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FF6A2E] to-[#FF2E63] text-white text-sm font-semibold rounded-xl hover:opacity-95 transition-opacity shadow-sm shadow-red-500/10 cursor-pointer"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#141413] flex">
      {/* Settings Dialog */}
      <SettingsDialog user={user} open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[280px] bg-white dark:bg-[#1D1B19] border-r border-[#E5DED5]/40 dark:border-[#2E2B27] p-6 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Slider */}
      <aside 
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-[#1D1B19] border-r border-[#E5DED5]/50 dark:border-[#2E2B27] p-6 z-50 transition-transform duration-300 transform",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button 
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-500 cursor-pointer"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Topbar Header */}
        <header className="bg-white/80 dark:bg-[#1D1B19]/80 backdrop-blur-md border-b border-[#E5DED5]/30 dark:border-[#2E2B27] h-20 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
          
          {/* Left search */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button 
              className="lg:hidden p-2 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-[#262421] dark:hover:bg-[#2e2b27] text-stone-600 dark:text-stone-300 cursor-pointer"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 dark:text-stone-500" />
              <input 
                type="text"
                placeholder="Search meetings, rooms or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#F4F4F4] dark:bg-[#262421] rounded-2xl text-[15px] border-none focus:outline-none focus:ring-1 focus:ring-[#FF6A2E]/50 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 transition-all"
              />
            </div>
          </div>

          {/* Right profile & tools */}
          <div className="flex items-center gap-3 sm:gap-4 ml-4">
            
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-[46px] h-[46px] rounded-full bg-[#F4F4F4]/70 dark:bg-[#262421]/70 hover:bg-[#F4F4F4] dark:hover:bg-[#262421] text-stone-600 dark:text-stone-300 transition-all border border-[#E5DED5]/20 dark:border-none cursor-pointer"
            >
              {theme === "dark" ? <Moon className="w-[19px] h-[19px] text-[#A8A29A]" /> : <Sun className="w-[19px] h-[19px] text-amber-500" />}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Separator */}
            <div className="w-[1px] h-8 bg-[#E5DED5]/50 dark:bg-[#2E2B27] hidden sm:block" />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1 rounded-full hover:bg-stone-50 dark:hover:bg-stone-900/40 text-left transition-colors focus:outline-none cursor-pointer">
                  <Avatar className="w-[40px] h-[40px] border border-stone-200 dark:border-stone-800">
                    <AvatarImage src={userAvatar} alt={displayName} className="object-cover object-[center_35%]" />
                    <AvatarFallback className="bg-[#FF6A2E] text-white font-semibold">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-[14px] font-semibold text-stone-900 dark:text-white leading-tight">{displayName}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/50 dark:border-[#2E2B27]">
                <div className="px-2.5 py-2">
                  <p className="text-[13px] text-stone-400 dark:text-stone-500 leading-tight">Signed in as</p>
                  <p className="text-[14px] font-semibold text-stone-800 dark:text-white truncate">{user.username}</p>
                </div>
                <DropdownMenuSeparator className="bg-[#E5DED5]/30 dark:bg-[#2E2B27]" />
                <DropdownMenuItem 
                  onSelect={() => setSettingsOpen(true)}
                  className="rounded-xl px-3 py-2 text-[14px] text-stone-700 dark:text-stone-300 focus:bg-stone-50 dark:focus:bg-[#262421] cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onSelect={() => toast.info("Meetings history logs coming soon.")}
                  className="rounded-xl px-3 py-2 text-[14px] text-stone-700 dark:text-stone-300 focus:bg-stone-50 dark:focus:bg-[#262421] cursor-pointer"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Meeting History
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#E5DED5]/30 dark:bg-[#2E2B27]" />
                <DropdownMenuItem 
                  onSelect={onSignOut}
                  className="rounded-xl px-3 py-2 text-[14px] text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        {/* Main Content Scroll Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
          <div className="max-w-[1400px] mx-auto">
            {currentTab === "dashboard" && (
              <div className="space-y-8 animate-fade-in">
                {/* Top welcome row */}
                <div>
                  <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#141413] dark:text-white leading-tight">Welcome back, {displayName}!</h1>
                  <p className="text-[#696969] dark:text-[#A8A29A] text-[15px] mt-1.5 font-medium">
                    Here's what's happening with your MeetFlow workspace today.
                  </p>
                </div>

                {/* Dashboard layout grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left: Live cards & Upcoming meetings */}
                  <div className="lg:col-span-8 space-y-8">
                    {/* Live Cards Row — user-pinned rooms, featured in this style */}
                    {pinnedRooms.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pinnedRooms.slice(0, 2).map((room, idx) => {
                          const theme = cardThemes[idx % cardThemes.length]
                          return (
                            <div
                              key={room.id}
                              onClick={() => onJoinRoom(room.id)}
                              className={cn("group relative overflow-hidden bg-gradient-to-br rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border", theme.cardBg, theme.cardBorder)}
                            >
                              <div className={cn("absolute -bottom-10 -right-10 w-44 h-44 rounded-full blur-md pointer-events-none group-hover:scale-110 transition-transform duration-500", theme.blob1)} />
                              <div className={cn("absolute bottom-6 -right-16 w-36 h-36 rounded-full blur-xs pointer-events-none group-hover:translate-x-2 transition-transform duration-500", theme.blob2)} />

                              <div className="flex items-center justify-between mb-8 relative z-10">
                                <button
                                  onClick={(e) => { e.stopPropagation(); togglePinRoom(room) }}
                                  className={cn("flex items-center gap-1.5 py-1 px-3 rounded-full text-[13px] font-bold cursor-pointer", theme.pillBg)}
                                  title="Unpin from dashboard"
                                >
                                  <Pin className="w-3.5 h-3.5 fill-current" />
                                  Pinned
                                </button>
                                {room.is_active && (
                                  <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-[#E6F9F1] dark:bg-[#1B362F] text-[#10B981] text-[13px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                    Active
                                  </div>
                                )}
                              </div>

                              <div className="relative z-10 mb-8">
                                <h3 className="text-2xl font-bold text-stone-900 dark:text-white leading-tight">{room.name}</h3>
                                <p className="text-[14px] text-stone-500 dark:text-stone-400 mt-1">{room.description || "No description"}</p>
                              </div>

                              <div className={cn("flex items-center justify-between relative z-10 mt-auto pt-4 border-t", theme.divider)}>
                                <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                                  Created {new Date(room.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </div>

                              <div className="flex items-center justify-end relative z-10 mt-5">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onJoinRoom(room.id) }}
                                  className={cn("flex items-center gap-1 px-4.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer", theme.button)}
                                >
                                  Join Room
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-[#1D1B19] border border-dashed border-[#E5DED5] dark:border-[#2E2B27] rounded-3xl p-6 text-center">
                        <p className="text-[14px] text-stone-500 dark:text-stone-400">
                          Pin a room from the <span className="font-semibold text-stone-700 dark:text-stone-300">Meeting Rooms</span> tab to feature it here.
                        </p>
                      </div>
                    )}

                    {/* Upcoming Scheduled Meetings */}
                    <div className="bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/40 dark:border-[#2E2B27] rounded-3xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Upcoming Scheduled Meetings</h3>
                      <div className="space-y-4">
                        {upcomingMeetings.length === 0 && (
                          <p className="text-[14px] text-stone-400 dark:text-stone-500 text-center py-4">
                            No upcoming meetings — schedule one from the Calendar tab or Quick Actions.
                          </p>
                        )}
                        {upcomingMeetings.slice(0, 5).map((meeting) => (
                          <div
                            key={meeting.id}
                            className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/20 dark:border-[#2E2B27]/40 rounded-2xl transition-all hover:bg-stone-50 dark:hover:bg-stone-900/40"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-[46px] h-[46px] rounded-2xl bg-[#EEF2FF] dark:bg-[#20203D] flex items-center justify-center text-[#6366F1] shrink-0">
                                <Users className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[15px] font-bold text-stone-900 dark:text-white group-hover:text-[#FF6A2E] dark:group-hover:text-[#F37338] transition-colors leading-tight truncate">{meeting.room_name}</h4>
                                <p className="text-[13px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">{meeting.room_description || "No description"}</p>
                              </div>
                            </div>
                            <div className="flex flex-row items-center justify-between md:justify-end gap-3 shrink-0">
                              <span className="text-[13px] font-semibold text-stone-500 dark:text-stone-400 whitespace-nowrap">
                                {new Date(meeting.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <button onClick={() => onJoinRoom(meeting.room_id)} className="py-2 px-4.5 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-850 hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-300 cursor-pointer">Join</button>
                              <button onClick={() => cancelMeeting(meeting.id)} className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer" title="Cancel meeting">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Donut chart & Quick Actions */}
                  <div className="lg:col-span-4 space-y-8">
                    {/* Donut Statistics Box */}
                    <div className="bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/40 dark:border-[#2E2B27] rounded-3xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Your Rooms</h3>
                      <div className="flex justify-center mb-6">
                        <div
                          className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-inner"
                          style={{
                            background: rooms.length === 0
                              ? '#E5DED5'
                              : `conic-gradient(#10B981 0% ${(scheduledCount / rooms.length) * 100}%, #F97316 ${(scheduledCount / rooms.length) * 100}% 100%)`
                          }}
                        >
                          <div className="w-[104px] h-[104px] rounded-full bg-white dark:bg-[#1D1B19] flex flex-col items-center justify-center">
                            <span className="text-3xl font-extrabold text-stone-950 dark:text-white">{rooms.length}</span>
                            <span className="text-[12px] text-stone-400 dark:text-stone-500 font-semibold tracking-wide">Total</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 pt-3 border-t border-[#E5DED5]/30 dark:border-[#2E2B27]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                            <span className="text-[14px] font-medium text-stone-600 dark:text-stone-400">Scheduled</span>
                          </div>
                          <span className="text-[14px] font-bold text-stone-900 dark:text-white">{scheduledCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                            <span className="text-[14px] font-medium text-stone-600 dark:text-stone-400">Instant</span>
                          </div>
                          <span className="text-[14px] font-bold text-stone-900 dark:text-white">{instantCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Pin className="w-2.5 h-2.5 text-[#8B5CF6] fill-current" />
                            <span className="text-[14px] font-medium text-stone-600 dark:text-stone-400">Pinned</span>
                          </div>
                          <span className="text-[14px] font-bold text-stone-900 dark:text-white">{pinnedRooms.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions List Box */}
                    <div className="bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/40 dark:border-[#2E2B27] rounded-3xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-5">Quick Actions</h3>
                      <div className="space-y-2">
                        <button onClick={() => setDialogOpen(true)} className="w-full flex items-center justify-between p-3.5 hover:bg-stone-50 dark:hover:bg-stone-900/60 rounded-2xl transition-colors cursor-pointer text-left group">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                            <span className="text-[14px] font-semibold text-stone-700 dark:text-stone-300">Schedule Meeting</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#FF6A2E] dark:group-hover:text-[#F37338] transition-colors" />
                        </button>
                        <button onClick={copyInviteLink} className="w-full flex items-center justify-between p-3.5 hover:bg-stone-50 dark:hover:bg-stone-900/60 rounded-2xl transition-colors cursor-pointer text-left group">
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                            <span className="text-[14px] font-semibold text-stone-700 dark:text-stone-300">Invite People</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#FF6A2E] dark:group-hover:text-[#F37338] transition-colors" />
                        </button>
                        <button onClick={startInstantMeeting} className="w-full flex items-center justify-between p-3.5 hover:bg-stone-50 dark:hover:bg-stone-900/60 rounded-2xl transition-colors cursor-pointer text-left group">
                          <div className="flex items-center gap-3">
                            <Video className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                            <span className="text-[14px] font-semibold text-stone-700 dark:text-stone-300">Start Instant Meeting</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#FF6A2E] dark:group-hover:text-[#F37338] transition-colors" />
                        </button>
                        <button onClick={() => toast.info("To share your screen, start/join any room first.")} className="w-full flex items-center justify-between p-3.5 hover:bg-stone-50 dark:hover:bg-stone-900/60 rounded-2xl transition-colors cursor-pointer text-left group">
                          <div className="flex items-center gap-3">
                            <Monitor className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                            <span className="text-[14px] font-semibold text-stone-700 dark:text-stone-300">Share Screen</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#FF6A2E] dark:group-hover:text-[#F37338] transition-colors" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentTab === "rooms" && (
              <div className="space-y-8 animate-fade-in">
                {/* Title and creation triggers */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#141413] dark:text-white leading-tight">Meeting Rooms</h1>
                    <p className="text-[#696969] dark:text-[#A8A29A] text-[15px] mt-1.5 font-medium">
                      Your rooms — invite others by sharing a link or room ID
                    </p>
                  </div>
                  
                  {/* Create New Room triggers */}
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-[#FF6A2E] to-[#FF2E63] text-white text-[15px] font-bold rounded-2xl hover:opacity-95 transition-opacity shadow-md shadow-red-500/10 self-start sm:self-auto cursor-pointer">
                        <Plus className="w-5 h-5 stroke-[2.5]" />
                        New Room
                      </button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl max-w-md bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/50 dark:border-[#2E2B27]">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Create a new room</DialogTitle>
                        <DialogDescription className="text-stone-500 dark:text-stone-400">
                          Set up a video conference room for your team.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={createRoom}>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="room-name" className="text-sm font-semibold">Room Name</Label>
                            <Input
                              id="room-name"
                              placeholder="Weekly Standup"
                              value={newRoomName}
                              onChange={(e) => setNewRoomName(e.target.value)}
                              required
                              className="rounded-xl border-[#E5DED5] dark:border-[#2E2B27] bg-[#F4F4F4]/30 dark:bg-stone-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="room-desc" className="text-sm font-semibold">Description (optional)</Label>
                            <Input
                              id="room-desc"
                              placeholder="Brief description of this room"
                              value={newRoomDesc}
                              onChange={(e) => setNewRoomDesc(e.target.value)}
                              className="rounded-xl border-[#E5DED5] dark:border-[#2E2B27] bg-[#F4F4F4]/30 dark:bg-stone-900"
                            />
                          </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
                          <Button type="submit" disabled={creating} className="bg-[#FF6A2E] hover:bg-[#FF6A2E]/90 text-white rounded-xl">
                            {creating ? "Creating..." : "Create"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Join code paste container */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <form onSubmit={joinByLink} className="flex items-center gap-0 w-full max-w-md bg-white dark:bg-[#1D1B19] rounded-2xl border border-[#E5DED5]/40 dark:border-[#2E2B27] p-1.5 shadow-sm">
                    <div className="flex items-center pl-3 flex-1">
                      <Link2 className="w-5 h-5 text-stone-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Paste an invite link or room ID"
                        value={joinInput}
                        onChange={(e) => setJoinInput(e.target.value)}
                        className="w-full pl-3 pr-2 py-2 bg-transparent text-[14px] border-none focus:outline-none text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={joining || !joinInput.trim()}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FFF5F5] hover:bg-[#FFEBEB] text-[#FF6A2E] dark:bg-[#3A2A1E] dark:text-[#F37338] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                  <button 
                    onClick={() => joinInput.trim() ? joinByLink() : toast.info("Please paste an invite link or ID into the input field first.")}
                    className="flex items-center justify-center gap-2 py-3 px-5 border border-stone-200 dark:border-[#2E2B27] bg-white dark:bg-[#1D1B19] hover:bg-stone-50 dark:hover:bg-stone-900/60 rounded-2xl text-[14px] font-semibold text-stone-700 dark:text-stone-300 transition-colors shadow-sm cursor-pointer"
                  >
                    <Link2 className="w-4 h-4 text-stone-500" />
                    Join by link
                  </button>
                </div>

                {/* Rooms Grid */}
                <div className="bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/40 dark:border-[#2E2B27] rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-stone-900 dark:text-white">Active Rooms ({filteredUserRooms.length})</h2>
                    <span className="text-xs font-semibold text-stone-450 dark:text-stone-500">Rooms list dynamically loaded</span>
                  </div>

                  {filteredUserRooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredUserRooms.map((room) => (
                        <div 
                          key={room.id}
                          onClick={() => onJoinRoom(room.id)}
                          className="group relative flex flex-col justify-between p-6 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/30 dark:border-[#2E2B27]/50 rounded-2xl transition-all cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/40"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF6A2E] to-[#FF2E63] flex items-center justify-center text-white shrink-0 shadow-sm">
                                <Video className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-[16px] font-bold text-stone-950 dark:text-white leading-tight">{room.name}</h4>
                                <p className="text-[13px] text-stone-455 dark:text-stone-500 mt-0.5 leading-snug">{room.description || "Active dynamic meeting room"}</p>
                              </div>
                            </div>
                            {String(room.created_by) === user.id && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => { e.stopPropagation(); togglePinRoom(room); }}
                                  className={cn(
                                    "p-2 rounded-lg cursor-pointer transition-colors",
                                    room.pinned ? "text-[#FF6A2E] hover:bg-[#FFF0ED] dark:hover:bg-[#3C221D]" : "text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900"
                                  )}
                                  title={room.pinned ? "Unpin from dashboard" : "Pin to dashboard"}
                                >
                                  <Pin className={cn("w-4 h-4", room.pinned && "fill-current")} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }}
                                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                                  title="Delete Room"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E5DED5]/20 dark:border-[#2E2B27]/20">
                            <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(room.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); onJoinRoom(room.id); }} className="py-1.5 px-4 text-xs font-bold rounded-lg bg-[#FF6A2E] text-white hover:bg-[#FF6A2E]/90 transition-colors shadow-sm select-none cursor-pointer">
                              Join Meeting
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Video className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
                      <h4 className="text-[15px] font-semibold text-stone-900 dark:text-white">No active rooms found</h4>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Create a new room above to start a video session.</p>
                    </div>
                  )}

                  {loading && (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A2E]" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentTab === "calendar" && (
              <div className="space-y-8 animate-fade-in">
                {/* Title */}
                <div>
                  <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#141413] dark:text-white leading-tight">Calendar</h1>
                  <p className="text-[#696969] dark:text-[#A8A29A] text-[15px] mt-1.5 font-medium">
                    Schedule, inspect, and join upcoming video calls.
                  </p>
                </div>

                {/* New Meeting Dialog */}
                <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
                  <DialogContent className="rounded-2xl max-w-md bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/50 dark:border-[#2E2B27]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Schedule a meeting</DialogTitle>
                      <DialogDescription className="text-stone-500 dark:text-stone-400">
                        {meetingDialogDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitNewMeeting}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="meeting-title" className="text-sm font-semibold">Title</Label>
                          <Input
                            id="meeting-title"
                            placeholder="Design Sync"
                            value={meetingTitle}
                            onChange={(e) => setMeetingTitle(e.target.value)}
                            required
                            className="rounded-xl border-[#E5DED5] dark:border-[#2E2B27] bg-[#F4F4F4]/30 dark:bg-stone-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="meeting-desc" className="text-sm font-semibold">Description (optional)</Label>
                          <Input
                            id="meeting-desc"
                            placeholder="Brief description of this meeting"
                            value={meetingDesc}
                            onChange={(e) => setMeetingDesc(e.target.value)}
                            className="rounded-xl border-[#E5DED5] dark:border-[#2E2B27] bg-[#F4F4F4]/30 dark:bg-stone-900"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="meeting-time" className="text-sm font-semibold">Time</Label>
                            <Input
                              id="meeting-time"
                              type="time"
                              value={meetingTime}
                              onChange={(e) => setMeetingTime(e.target.value)}
                              required
                              className="rounded-xl border-[#E5DED5] dark:border-[#2E2B27] bg-[#F4F4F4]/30 dark:bg-stone-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="meeting-duration" className="text-sm font-semibold">Duration (min)</Label>
                            <Input
                              id="meeting-duration"
                              type="number"
                              min={15}
                              step={15}
                              value={meetingDuration}
                              onChange={(e) => setMeetingDuration(Number(e.target.value) || 60)}
                              className="rounded-xl border-[#E5DED5] dark:border-[#2E2B27] bg-[#F4F4F4]/30 dark:bg-stone-900"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={() => setMeetingDialogOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button type="submit" disabled={creatingMeeting} className="bg-[#FF6A2E] hover:bg-[#FF6A2E]/90 text-white rounded-xl">
                          {creatingMeeting ? "Scheduling..." : "Schedule"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Calendar Layout */}
                <div className="bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/40 dark:border-[#2E2B27] rounded-3xl p-6 shadow-sm">
                  {/* Calendar Month Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-stone-900 dark:text-white">{monthLabel}</h3>
                    <div className="flex gap-2">
                      <button onClick={goToPrevMonth} className="p-2 border border-stone-200 dark:border-[#2E2B27] hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl cursor-pointer">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <button onClick={goToNextMonth} className="p-2 border border-stone-200 dark:border-[#2E2B27] hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl cursor-pointer">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {/* Leading days from the previous month */}
                    {Array.from({ length: firstWeekday }).map((_, idx) => {
                      const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
                      const dayNum = prevMonthLastDay - firstWeekday + idx + 1
                      return (
                        <div key={`prev-${idx}`} className="h-28 bg-[#FAFAFA]/50 dark:bg-stone-900/10 rounded-xl border border-[#E5DED5]/20 dark:border-[#2E2B27]/20 p-2 text-stone-300">{dayNum}</div>
                      )
                    })}

                    {/* Real days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1
                      const isToday = isCurrentRealMonth && dayNum === today.getDate()
                      const dayMeetings = meetingsByDay.get(String(dayNum)) || []
                      return (
                        <div
                          key={dayNum}
                          onClick={() => openNewMeetingDialog(new Date(currentYear, currentMonth, dayNum))}
                          className={cn(
                            "h-28 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/40 dark:border-[#2E2B27]/60 rounded-xl p-2 cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/40 relative flex flex-col justify-between overflow-hidden",
                            isToday && "ring-2 ring-[#FF6A2E]"
                          )}
                        >
                          <span className={cn("text-sm font-bold", isToday ? "text-[#FF6A2E] dark:text-[#F37338]" : "text-stone-850 dark:text-stone-350")}>{dayNum}</span>

                          {dayMeetings.length > 0 && (
                            <div className="space-y-1 mt-1.5">
                              {dayMeetings.slice(0, 3).map((meeting) => {
                                const color = meetingColors[hashToIndex(meeting.id, meetingColors.length)]
                                const time = new Date(meeting.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
                                return (
                                  <div
                                    key={meeting.id}
                                    onClick={(e) => { e.stopPropagation(); onJoinRoom(meeting.room_id) }}
                                    className={cn("group/chip flex items-center justify-between gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded truncate leading-tight", color.bg, color.text)}
                                  >
                                    <span className="truncate">{time} {meeting.room_name}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); cancelMeeting(meeting.id) }}
                                      className="hidden group-hover/chip:inline-flex shrink-0 hover:opacity-70"
                                      title="Cancel meeting"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Trailing days from the next month */}
                    {Array.from({ length: (7 - (firstWeekday + daysInMonth) % 7) % 7 }).map((_, idx) => (
                      <div key={`next-${idx}`} className="h-28 bg-[#FAFAFA]/50 dark:bg-stone-900/10 rounded-xl border border-[#E5DED5]/20 dark:border-[#2E2B27]/20 p-2 text-stone-300">{idx + 1}</div>
                    ))}
                  </div>

                  {meetingsLoading && (
                    <div className="py-8 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A2E]" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentTab === "recordings" && (
              <div className="space-y-8 animate-fade-in">
                {/* Title */}
                <div>
                  <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#141413] dark:text-white leading-tight">Recordings</h1>
                  <p className="text-[#696969] dark:text-[#A8A29A] text-[15px] mt-1.5 font-medium">
                    Access and watch saved video playbacks of your E2EE conferences.
                  </p>
                </div>

                {/* Playback Dialog */}
                <Dialog open={!!playbackRecording} onOpenChange={(open) => !open && closePlayback()}>
                  <DialogContent className="rounded-2xl max-w-2xl bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/50 dark:border-[#2E2B27]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">{playbackRecording?.display_name}</DialogTitle>
                      <DialogDescription className="text-stone-500 dark:text-stone-400">
                        {playbackRecording && new Date(playbackRecording.created_at).toLocaleString()}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="aspect-video rounded-xl bg-black flex items-center justify-center overflow-hidden">
                      {playbackLoading && (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A2E]" />
                      )}
                      {!playbackLoading && playbackUrl && (
                        <video src={playbackUrl} controls autoPlay className="w-full h-full" />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Recordings list */}
                <div className="bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/40 dark:border-[#2E2B27] rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-stone-900 dark:text-white">Past Conference Recordings ({recordings.length})</h2>
                    <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">Recordings stored securely, end-to-end encrypted</span>
                  </div>

                  {recordingsLoading && (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A2E]" />
                    </div>
                  )}

                  {!recordingsLoading && recordings.length === 0 && (
                    <div className="py-12 text-center">
                      <Disc className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
                      <h4 className="text-[15px] font-semibold text-stone-900 dark:text-white">No recordings yet</h4>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Start recording during a call to see it appear here.</p>
                    </div>
                  )}

                  {!recordingsLoading && recordings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recordings.map((recording) => (
                        <div key={recording.id} className="group relative bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/30 dark:border-[#2E2B27]/50 rounded-2xl p-5 hover:shadow-md transition-all">
                          <div className="relative aspect-video rounded-xl bg-gradient-to-br from-[#35252b] to-[#1e1d35] flex items-center justify-center mb-4 overflow-hidden">
                            <Disc className="w-12 h-12 text-[#FF6A2E]" />
                            <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">{formatDuration(recording.duration_seconds)}</span>
                          </div>
                          <h4 className="text-[15px] font-bold text-stone-950 dark:text-white leading-tight">{recording.display_name}</h4>
                          <p className="text-xs text-stone-400 mt-1 leading-snug">
                            Recorded {new Date(recording.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {formatFileSize(recording.file_size)}
                          </p>
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E5DED5]/20 dark:border-[#2E2B27]/20">
                            <button onClick={() => watchRecording(recording)} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold bg-[#FF6A2E] text-white rounded-xl hover:bg-[#FF6A2E]/90 transition-colors shadow-sm cursor-pointer text-center">
                              <Play className="w-3.5 h-3.5" />
                              Watch Playback
                            </button>
                            <button onClick={() => downloadRecording(recording)} className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold border border-stone-200 dark:border-[#2E2B27] hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl cursor-pointer">
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                            <button onClick={() => deleteRecording(recording)} className="flex items-center justify-center p-2 text-red-500 border border-stone-200 dark:border-[#2E2B27] hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer" title="Delete recording">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentTab === "contacts" && (
              <div className="space-y-8 animate-fade-in">
                {/* Title */}
                <div>
                  <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#141413] dark:text-white leading-tight">Contacts</h1>
                  <p className="text-[#696969] dark:text-[#A8A29A] text-[15px] mt-1.5 font-medium">
                    Start instant encrypted calls or connect directly with teammates.
                  </p>
                </div>

                {/* Contacts grid */}
                <div className="bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/40 dark:border-[#2E2B27] rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-stone-900 dark:text-white">All Contacts ({contacts.length})</h2>
                    <form
                      onSubmit={(e) => { e.preventDefault(); fetchContacts(contactSearch) }}
                      className="relative max-w-xs w-full"
                    >
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Search contact..."
                        value={contactSearch}
                        onChange={(e) => {
                          setContactSearch(e.target.value)
                          fetchContacts(e.target.value)
                        }}
                        className="w-full pl-9 pr-4 py-2 border border-stone-200 dark:border-stone-800 rounded-xl bg-[#F4F4F4]/30 dark:bg-stone-900 text-xs outline-none focus:border-[#FF6A2E]"
                      />
                    </form>
                  </div>

                  {contactsLoading && (
                    <div className="py-12 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6A2E]" />
                    </div>
                  )}

                  {!contactsLoading && contacts.length === 0 && (
                    <div className="py-12 text-center">
                      <Users className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
                      <h4 className="text-[15px] font-semibold text-stone-900 dark:text-white">No contacts found</h4>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Other registered users will show up here.</p>
                    </div>
                  )}

                  {!contactsLoading && contacts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contacts.map((contact) => {
                        const contactName = contact.first_name || contact.username
                        return (
                          <div key={contact.id} className="flex items-center justify-between p-4 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/20 dark:border-[#2E2B27]/40 rounded-2xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="w-[42px] h-[42px] border border-stone-200 dark:border-stone-850 shrink-0">
                                <AvatarFallback className="bg-[#FF6A2E] text-white font-semibold">{getInitials(contactName)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <h4 className="text-[14px] font-bold text-stone-900 dark:text-white leading-tight truncate">{contactName}</h4>
                                <span className="text-[11px] text-stone-400 font-medium truncate block">{contact.email || contact.username}</span>
                              </div>
                            </div>
                            <button onClick={() => callContact(contact)} className="p-2.5 bg-[#FF6A2E] hover:bg-[#FF6A2E]/90 text-white rounded-xl shadow-sm transition-colors cursor-pointer shrink-0" title="Call">
                              <Video className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
</div>
        </main>

      </div>
    </div>
  )
}
