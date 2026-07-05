import { useState, useEffect, useCallback } from "react"
import { api, type Room, type AuthUser } from "@/lib/api"
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
  LayoutDashboard, Video, Calendar, Disc, Users, Settings, Crown, Search, Bell, 
  ChevronDown, ChevronRight, Plus, Link2, ArrowRight, Clock, Trash2, Folder, 
  Monitor, LogOut, Sun, Moon, Menu, X
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

  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem(`user-avatar-${user.id}`) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces&q=80")

  useEffect(() => {
    const handleAuthChanged = () => {
      const saved = localStorage.getItem(`user-avatar-${user.id}`)
      if (saved) {
        setUserAvatar(saved)
      } else {
        setUserAvatar("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces&q=80")
      }
    }
    window.addEventListener("auth-changed", handleAuthChanged)
    handleAuthChanged()
    return () => window.removeEventListener("auth-changed", handleAuthChanged)
  }, [user.id])

  const displayName = user.user_metadata?.display_name || user.username || "User"
  
  // Stable high-quality avatar image URLs
  const avatars = {
    johnDoe: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces&q=80",
    user1: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces&q=80",
    user2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces&q=80",
    user3: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces&q=80",
    user4: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces&q=80",
    user5: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=faces&q=80",
    user6: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces&q=80",
    user7: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces&q=80",
    user8: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces&q=80",
    user9: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces&q=80",
    user10: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces&q=80",
    user11: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces&q=80",
    user12: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=faces&q=80",
  }

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

  // Interactive handler for mock cards to auto-create or join the corresponding room
  const handleJoinMockRoom = async (name: string, description: string) => {
    const existing = rooms.find(r => r.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      onJoinRoom(existing.id)
    } else {
      const loadingToast = toast.loading(`Starting dynamic room "${name}"...`)
      try {
        const data = await api.createRoom(name, description)
        toast.dismiss(loadingToast)
        onJoinRoom(data.id)
      } catch {
        toast.dismiss(loadingToast)
        toast.error(`Failed to start ${name}`)
      }
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

  const isDesignSyncMatch = "design sync".includes(searchQuery.toLowerCase()) || "weekly design team sync".includes(searchQuery.toLowerCase())
  const isProductReviewMatch = "product review".includes(searchQuery.toLowerCase()) || "discuss new features and roadmap".includes(searchQuery.toLowerCase())
  const isMarketingMatch = "marketing strategy".includes(searchQuery.toLowerCase()) || "discuss q3 marketing plan and goals".includes(searchQuery.toLowerCase())
  const isClientOnboardingMatch = "client onboarding".includes(searchQuery.toLowerCase()) || "welcome and onboarding new client".includes(searchQuery.toLowerCase())

  const [currentTab, setCurrentTab] = useState<"dashboard" | "rooms" | "calendar" | "recordings" | "contacts">("dashboard")

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

            {/* Notification button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="w-[46px] h-[46px] rounded-full bg-[#F4F4F4]/70 dark:bg-[#262421]/70 hover:bg-[#F4F4F4] dark:hover:bg-[#262421] text-stone-600 dark:text-stone-300 border border-[#E5DED5]/20 dark:border-none cursor-pointer"
                onClick={() => toast.info("You have 3 unread meeting alerts.")}
              >
                <Bell className="w-[19px] h-[19px] text-stone-600 dark:text-stone-300" />
              </Button>
              <span className="absolute top-[3px] right-[3px] w-5 h-5 bg-[#FF2E63] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1D1B19]">
                3
              </span>
            </div>

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
                    {/* Live Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {isDesignSyncMatch && (
                        <div 
                          onClick={() => handleJoinMockRoom("Design Sync", "Weekly design team sync")}
                          className="group relative overflow-hidden bg-gradient-to-br from-[#FFF6F6] to-[#FFF1F1] dark:from-[#251B18] dark:to-[#1F1816] border border-[#FFE2E2] dark:border-[#382620] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                        >
                          <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-[#FFD6D6]/45 dark:bg-[#3E211A]/40 blur-md pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute bottom-6 -right-16 w-36 h-36 rounded-full bg-[#FFE2E2]/65 dark:bg-[#4D271D]/30 blur-xs pointer-events-none group-hover:translate-x-2 transition-transform duration-500" />
                          
                          <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-[#FFEBEB] dark:bg-[#3D1E1E] text-[#EF4444] text-[13px] font-bold">
                              <Users className="w-3.5 h-3.5" />
                              3
                            </div>
                            <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-[#E6F9F1] dark:bg-[#1B362F] text-[#10B981] text-[13px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                              Live
                            </div>
                          </div>

                          <div className="relative z-10 mb-8">
                            <h3 className="text-2xl font-bold text-stone-900 dark:text-white leading-tight">Design Sync</h3>
                            <p className="text-[14px] text-stone-500 dark:text-stone-400 mt-1">Weekly design team sync</p>
                          </div>

                          <div className="flex items-center justify-between relative z-10 mt-auto pt-4 border-t border-[#FFE2E2]/60 dark:border-[#382620]/60">
                            <div className="flex items-center gap-3.5">
                              <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                Today, 10:30 AM
                              </div>
                              <div className="w-[1.5px] h-3 bg-stone-300 dark:bg-stone-850" />
                              <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                32:15
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between relative z-10 mt-5">
                            <div className="flex items-center">
                              <div className="flex -space-x-2.5">
                                <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-stone-950">
                                  <AvatarImage src={avatars.user1} />
                                  <AvatarFallback>A</AvatarFallback>
                                </Avatar>
                                <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-stone-950">
                                  <AvatarImage src={avatars.user2} />
                                  <AvatarFallback>B</AvatarFallback>
                                </Avatar>
                                <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-stone-950">
                                  <AvatarImage src={avatars.user3} />
                                  <AvatarFallback>C</AvatarFallback>
                                </Avatar>
                              </div>
                              <span className="ml-2.5 text-xs font-bold text-[#FF6A2E] dark:text-[#F37338] py-0.5 px-2 bg-[#FFF0ED] dark:bg-[#3C221D] rounded-full">
                                +2
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button className="flex items-center gap-1 px-4.5 py-2 rounded-full border border-[#FF6A2E]/30 text-[#FF6A2E] dark:text-[#F37338] bg-white/70 dark:bg-stone-900/60 hover:bg-[#FF6A2E] hover:text-white dark:hover:bg-[#F37338] dark:hover:text-stone-950 text-xs font-bold transition-all cursor-pointer">
                                Join Room
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {isProductReviewMatch && (
                        <div 
                          onClick={() => handleJoinMockRoom("Product Review", "Discuss new features and roadmap")}
                          className="group relative overflow-hidden bg-gradient-to-br from-[#F6F4FF] to-[#EFF0FE] dark:from-[#1A1A2B] dark:to-[#171626] border border-[#E0DCFE] dark:border-[#2B294A] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                        >
                          <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-[#E5E0FF]/45 dark:bg-[#252144]/40 blur-md pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute bottom-6 -right-16 w-36 h-36 rounded-full bg-[#ECE9FF]/65 dark:bg-[#2F295B]/30 blur-xs pointer-events-none group-hover:translate-x-2 transition-transform duration-500" />
                          
                          <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-[#F0EDFF] dark:bg-[#2B244D] text-[#6366F1] text-[13px] font-bold">
                              <Users className="w-3.5 h-3.5" />
                              5
                            </div>
                            <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-[#E6F9F1] dark:bg-[#1B362F] text-[#10B981] text-[13px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                              Live
                            </div>
                          </div>

                          <div className="relative z-10 mb-8">
                            <h3 className="text-2xl font-bold text-stone-900 dark:text-white leading-tight">Product Review</h3>
                            <p className="text-[14px] text-stone-500 dark:text-stone-400 mt-1">Discuss new features and roadmap</p>
                          </div>

                          <div className="flex items-center justify-between relative z-10 mt-auto pt-4 border-t border-[#E0DCFE]/60 dark:border-[#2D2A4A]/60">
                            <div className="flex items-center gap-3.5">
                              <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                Today, 02:00 PM
                              </div>
                              <div className="w-[1.5px] h-3 bg-stone-300 dark:bg-stone-850" />
                              <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                1:05:42
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between relative z-10 mt-5">
                            <div className="flex items-center">
                              <div className="flex -space-x-2.5">
                                <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-stone-950">
                                  <AvatarImage src={avatars.user4} />
                                  <AvatarFallback>D</AvatarFallback>
                                </Avatar>
                                <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-stone-950">
                                  <AvatarImage src={avatars.user5} />
                                  <AvatarFallback>E</AvatarFallback>
                                </Avatar>
                                <Avatar className="w-8 h-8 ring-2 ring-white dark:ring-stone-950">
                                  <AvatarImage src={avatars.user6} />
                                  <AvatarFallback>F</AvatarFallback>
                                </Avatar>
                              </div>
                              <span className="ml-2.5 text-xs font-bold text-[#6366F1] dark:text-[#8B5CF6] py-0.5 px-2 bg-[#EEF2FF] dark:bg-[#20203D] rounded-full">
                                +3
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button className="flex items-center gap-1 px-4.5 py-2 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold transition-all shadow-sm shadow-[#6366F1]/10 cursor-pointer">
                                Join Room
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upcoming Scheduled Meetings */}
                    <div className="bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/40 dark:border-[#2E2B27] rounded-3xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Upcoming Scheduled Meetings</h3>
                      <div className="space-y-4">
                        {isMarketingMatch && (
                          <div 
                            onClick={() => handleJoinMockRoom("Marketing Strategy", "Discuss Q3 marketing plan and goals")}
                            className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/20 dark:border-[#2E2B27]/40 rounded-2xl transition-all cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/40"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-[46px] h-[46px] rounded-2xl bg-[#EEF2FF] dark:bg-[#20203D] flex items-center justify-center text-[#6366F1] shrink-0">
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-[15px] font-bold text-stone-900 dark:text-white group-hover:text-[#FF6A2E] dark:group-hover:text-[#F37338] transition-colors leading-tight">Marketing Strategy</h4>
                                <p className="text-[13px] text-stone-400 dark:text-stone-500 mt-0.5">Discuss Q3 marketing plan and goals</p>
                              </div>
                            </div>
                            <div className="flex flex-row items-center justify-between md:justify-end gap-5">
                              <span className="text-[13px] font-semibold text-stone-500 dark:text-stone-400">Jul 6, 11:00 AM</span>
                              <button className="py-2 px-4.5 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-850 hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-300 cursor-pointer">Join</button>
                            </div>
                          </div>
                        )}

                        {isClientOnboardingMatch && (
                          <div 
                            onClick={() => handleJoinMockRoom("Client Onboarding", "Welcome and onboarding new client")}
                            className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/20 dark:border-[#2E2B27]/40 rounded-2xl transition-all cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/40"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-[46px] h-[46px] rounded-2xl bg-[#FFF7ED] dark:bg-[#3B2519] flex items-center justify-center text-[#F97316] shrink-0">
                                <Folder className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-[15px] font-bold text-stone-900 dark:text-white group-hover:text-[#FF6A2E] dark:group-hover:text-[#F37338] transition-colors leading-tight">Client Onboarding</h4>
                                <p className="text-[13px] text-stone-400 dark:text-stone-500 mt-0.5">Welcome and onboarding new client</p>
                              </div>
                            </div>
                            <div className="flex flex-row items-center justify-between md:justify-end gap-5">
                              <span className="text-[13px] font-semibold text-stone-500 dark:text-stone-400">Jul 8, 03:00 PM</span>
                              <button className="py-2 px-4.5 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-850 hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-300 cursor-pointer">Join</button>
                            </div>
                          </div>
                        )}
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
                          style={{ background: 'conic-gradient(#10B981 0% 33.3%, #F97316 33.3% 75%, #8B5CF6 75% 100%)' }}
                        >
                          <div className="w-[104px] h-[104px] rounded-full bg-white dark:bg-[#1D1B19] flex flex-col items-center justify-center">
                            <span className="text-3xl font-extrabold text-stone-950 dark:text-white">12</span>
                            <span className="text-[12px] text-stone-400 dark:text-stone-500 font-semibold tracking-wide">Total</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 pt-3 border-t border-[#E5DED5]/30 dark:border-[#2E2B27]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                            <span className="text-[14px] font-medium text-stone-600 dark:text-stone-400">Live</span>
                          </div>
                          <span className="text-[14px] font-bold text-stone-900 dark:text-white">4</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                            <span className="text-[14px] font-medium text-stone-600 dark:text-stone-400">Upcoming</span>
                          </div>
                          <span className="text-[14px] font-bold text-stone-900 dark:text-white">5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                            <span className="text-[14px] font-medium text-stone-600 dark:text-stone-400">Completed</span>
                          </div>
                          <span className="text-[14px] font-bold text-stone-900 dark:text-white">3</span>
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
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                                title="Delete Room"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

                {/* Calendar Layout */}
                <div className="bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/40 dark:border-[#2E2B27] rounded-3xl p-6 shadow-sm">
                  {/* Calendar Month Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-stone-900 dark:text-white">July 2026</h3>
                    <div className="flex gap-2">
                      <button onClick={() => toast.info("Viewing previous month.")} className="p-2 border border-stone-200 dark:border-[#2E2B27] hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl cursor-pointer">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <button onClick={() => toast.info("Viewing next month.")} className="p-2 border border-stone-200 dark:border-[#2E2B27] hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl cursor-pointer">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {/* Render empty offset days (1, 2, 3 offset for July 2026 starts on Wednesday) */}
                    <div className="h-28 bg-[#FAFAFA]/50 dark:bg-stone-900/10 rounded-xl border border-[#E5DED5]/20 dark:border-[#2E2B27]/20 p-2 text-stone-300">28</div>
                    <div className="h-28 bg-[#FAFAFA]/50 dark:bg-stone-900/10 rounded-xl border border-[#E5DED5]/20 dark:border-[#2E2B27]/20 p-2 text-stone-300">29</div>
                    <div className="h-28 bg-[#FAFAFA]/50 dark:bg-stone-900/10 rounded-xl border border-[#E5DED5]/20 dark:border-[#2E2B27]/20 p-2 text-stone-300">30</div>

                    {/* Day 1 - 31 */}
                    {Array.from({ length: 31 }).map((_, idx) => {
                      const dayNum = idx + 1
                      const isToday = dayNum === 5 // July 5 today
                      return (
                        <div 
                          key={dayNum} 
                          onClick={() => toast.info(`Schedule details for July ${dayNum}, 2026.`)}
                          className={cn(
                            "h-28 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/40 dark:border-[#2E2B27]/60 rounded-xl p-2 cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/40 relative flex flex-col justify-between",
                            isToday && "ring-2 ring-[#FF6A2E]"
                          )}
                        >
                          <span className={cn("text-sm font-bold", isToday ? "text-[#FF6A2E] dark:text-[#F37338]" : "text-stone-850 dark:text-stone-350")}>{dayNum}</span>
                          
                          {/* Meetings on specific days */}
                          {dayNum === 5 && (
                            <div className="space-y-1 mt-1.5">
                              <div className="text-[10px] font-bold bg-[#FFF5F5] text-[#FF6A2E] dark:bg-[#3B221B] dark:text-[#F37338] px-1.5 py-0.5 rounded truncate leading-tight">10:00 Design Sync</div>
                              <div className="text-[10px] font-bold bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#281D3E] dark:text-[#A78BFA] px-1.5 py-0.5 rounded truncate leading-tight">13:00 Product Review</div>
                            </div>
                          )}
                          {dayNum === 6 && (
                            <div className="mt-1.5">
                              <div className="text-[10px] font-bold bg-[#EFF6FF] text-[#3B82F6] dark:bg-[#1E293B] dark:text-[#60A5FA] px-1.5 py-0.5 rounded truncate leading-tight">11:00 Marketing Plan</div>
                            </div>
                          )}
                          {dayNum === 8 && (
                            <div className="mt-1.5">
                              <div className="text-[10px] font-bold bg-[#FFF7ED] text-[#F97316] dark:bg-[#3B2519] dark:text-[#FDBA74] px-1.5 py-0.5 rounded truncate leading-tight">15:00 Client Kickoff</div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Offset days next month */}
                    <div className="h-28 bg-[#FAFAFA]/50 dark:bg-stone-900/10 rounded-xl border border-[#E5DED5]/20 dark:border-[#2E2B27]/20 p-2 text-stone-300">1</div>
                  </div>
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

                {/* Recordings list */}
                <div className="bg-white dark:bg-[#1D1B19] border border-[#E5DED5]/40 dark:border-[#2E2B27] rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-stone-900 dark:text-white">Past Conference Audits ({3})</h2>
                    <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">Recordings stored securely</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Recording 1 */}
                    <div className="group relative bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/30 dark:border-[#2E2B27]/50 rounded-2xl p-5 hover:shadow-md transition-all">
                      <div className="relative aspect-video rounded-xl bg-gradient-to-br from-[#35252b] to-[#1e1d35] flex items-center justify-center mb-4 overflow-hidden">
                        <Disc className="w-12 h-12 text-[#FF6A2E] animate-pulse" />
                        <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">01:14:20</span>
                      </div>
                      <h4 className="text-[15px] font-bold text-stone-950 dark:text-white leading-tight">Q2 Roadmap Alignment</h4>
                      <p className="text-xs text-stone-400 mt-1 leading-snug">Recorded Jun 28, 2026 • 1.2 GB • MP4</p>
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E5DED5]/20 dark:border-[#2E2B27]/20">
                        <button onClick={() => toast.success("Loading video player wizard...")} className="flex-1 py-2 px-3 text-xs font-bold bg-[#FF6A2E] text-white rounded-xl hover:bg-[#FF6A2E]/90 transition-colors shadow-sm cursor-pointer text-center">Watch Playback</button>
                        <button onClick={() => toast.success("Starting download...")} className="py-2 px-3 text-xs font-bold border border-stone-200 dark:border-[#2E2B27] hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl cursor-pointer">Download</button>
                      </div>
                    </div>

                    {/* Recording 2 */}
                    <div className="group relative bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/30 dark:border-[#2E2B27]/50 rounded-2xl p-5 hover:shadow-md transition-all">
                      <div className="relative aspect-video rounded-xl bg-gradient-to-br from-[#2E1E1E] to-[#171626] flex items-center justify-center mb-4 overflow-hidden">
                        <Disc className="w-12 h-12 text-[#7C3AED] animate-pulse" />
                        <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">00:45:12</span>
                      </div>
                      <h4 className="text-[15px] font-bold text-stone-950 dark:text-white leading-tight">Weekly Design Team Sync</h4>
                      <p className="text-xs text-stone-400 mt-1 leading-snug">Recorded Jun 22, 2026 • 450 MB • MP4</p>
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E5DED5]/20 dark:border-[#2E2B27]/20">
                        <button onClick={() => toast.success("Loading video player wizard...")} className="flex-1 py-2 px-3 text-xs font-bold bg-[#FF6A2E] text-white rounded-xl hover:bg-[#FF6A2E]/90 transition-colors shadow-sm cursor-pointer text-center">Watch Playback</button>
                        <button onClick={() => toast.success("Starting download...")} className="py-2 px-3 text-xs font-bold border border-stone-200 dark:border-[#2E2B27] hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl cursor-pointer">Download</button>
                      </div>
                    </div>

                    {/* Recording 3 */}
                    <div className="group relative bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/30 dark:border-[#2E2B27]/50 rounded-2xl p-5 hover:shadow-md transition-all">
                      <div className="relative aspect-video rounded-xl bg-gradient-to-br from-[#1b251f] to-[#12232b] flex items-center justify-center mb-4 overflow-hidden">
                        <Disc className="w-12 h-12 text-[#10B981] animate-pulse" />
                        <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">01:05:00</span>
                      </div>
                      <h4 className="text-[15px] font-bold text-stone-950 dark:text-white leading-tight">Client Kickoff - Marketing</h4>
                      <p className="text-xs text-stone-400 mt-1 leading-snug">Recorded Jun 15, 2026 • 850 MB • MP4</p>
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E5DED5]/20 dark:border-[#2E2B27]/20">
                        <button onClick={() => toast.success("Loading video player wizard...")} className="flex-1 py-2 px-3 text-xs font-bold bg-[#FF6A2E] text-white rounded-xl hover:bg-[#FF6A2E]/90 transition-colors shadow-sm cursor-pointer text-center">Watch Playback</button>
                        <button onClick={() => toast.success("Starting download...")} className="py-2 px-3 text-xs font-bold border border-stone-200 dark:border-[#2E2B27] hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl cursor-pointer">Download</button>
                      </div>
                    </div>
                  </div>
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
                    <h2 className="text-lg font-bold text-stone-900 dark:text-white">Active Contacts</h2>
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input 
                        type="text" 
                        placeholder="Search contact..." 
                        className="w-full pl-9 pr-4 py-2 border border-stone-200 dark:border-stone-800 rounded-xl bg-[#F4F4F4]/30 dark:bg-stone-900 text-xs outline-none focus:border-[#FF6A2E]" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contact 1 */}
                    <div className="flex items-center justify-between p-4 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/20 dark:border-[#2E2B27]/40 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-[42px] h-[42px] border border-stone-200 dark:border-stone-850">
                            <AvatarImage src={avatars.user1} />
                          </Avatar>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-stone-950" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-stone-900 dark:text-white leading-tight">Sarah Jenkins</h4>
                          <span className="text-[11px] text-[#FF6A2E] font-semibold">Product Design</span>
                        </div>
                      </div>
                      <button onClick={startInstantMeeting} className="p-2.5 bg-[#FF6A2E] hover:bg-[#FF6A2E]/90 text-white rounded-xl shadow-sm transition-colors cursor-pointer" title="Call">
                        <Video className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Contact 2 */}
                    <div className="flex items-center justify-between p-4 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/20 dark:border-[#2E2B27]/40 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-[42px] h-[42px] border border-stone-200 dark:border-stone-850">
                            <AvatarImage src={avatars.user4} />
                          </Avatar>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-stone-300 rounded-full ring-2 ring-white dark:ring-stone-950" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-stone-900 dark:text-white leading-tight">Alex Rivera</h4>
                          <span className="text-[11px] text-stone-400 font-medium">Frontend Developer</span>
                        </div>
                      </div>
                      <button onClick={() => toast.info("Alex is currently offline. An invitation email was sent.")} className="p-2.5 bg-stone-100 dark:bg-[#262421] text-stone-400 rounded-xl hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer" title="Invite">
                        <Users className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Contact 3 */}
                    <div className="flex items-center justify-between p-4 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/20 dark:border-[#2E2B27]/40 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-[42px] h-[42px] border border-stone-200 dark:border-stone-850">
                            <AvatarImage src={avatars.user7} />
                          </Avatar>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-stone-950" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-stone-900 dark:text-white leading-tight">Emma Watson</h4>
                          <span className="text-[11px] text-purple-500 font-semibold">Security & Cryptography</span>
                        </div>
                      </div>
                      <button onClick={startInstantMeeting} className="p-2.5 bg-[#FF6A2E] hover:bg-[#FF6A2E]/90 text-white rounded-xl shadow-sm transition-colors cursor-pointer" title="Call">
                        <Video className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Contact 4 */}
                    <div className="flex items-center justify-between p-4 bg-[#FAFAFA] dark:bg-[#141312] border border-[#E5DED5]/20 dark:border-[#2E2B27]/40 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-[42px] h-[42px] border border-stone-200 dark:border-stone-850">
                            <AvatarImage src={avatars.user10} />
                          </Avatar>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-stone-950" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-stone-900 dark:text-white leading-tight">Michael Chen</h4>
                          <span className="text-[11px] text-emerald-500 font-semibold">Technical Sales Lead</span>
                        </div>
                      </div>
                      <button onClick={startInstantMeeting} className="p-2.5 bg-[#FF6A2E] hover:bg-[#FF6A2E]/90 text-white rounded-xl shadow-sm transition-colors cursor-pointer" title="Call">
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
</div>
        </main>

      </div>
    </div>
  )
}
