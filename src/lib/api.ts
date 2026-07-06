const BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000/api"
const WS_BASE_URL = (import.meta.env.VITE_WS_URL as string) || "ws://localhost:8000/ws"

export type DjangoUser = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export type AuthUser = {
  id: string
  email: string
  username: string
  user_metadata?: {
    display_name?: string
    avatar_url?: string
  }
}

export type Room = {
  id: string
  name: string
  description: string | null
  created_by: number | null
  created_by_name?: string
  created_at: string
  is_active: boolean
  pinned: boolean
}

export type Message = {
  id: string
  room_id: string
  user_id: string
  display_name: string
  content: string
  iv?: string
  created_at: string
}

export type SharedFile = {
  id: string
  room_id: string
  user_id: string
  display_name: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  iv?: string
  created_at: string
}

export type Recording = {
  id: string
  room_id: string
  room_name?: string
  created_by: number | null
  created_by_name?: string
  display_name: string
  file_url: string
  file_size: number
  mime_type: string
  iv?: string
  duration_seconds: number
  created_at: string
}

export type ScheduledMeeting = {
  id: string
  room_id: string
  room_name: string
  room_description: string | null
  created_by: number | null
  created_by_name?: string
  scheduled_at: string
  duration_minutes: number
  created_at: string
}

// Token storage key
const TOKEN_KEY = "django_rtc_token"

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set("Authorization", `Token ${token}`)
  }

  // Set Content-Type only if it's not FormData (multipart file upload)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || response.statusText || "Request failed")
  }

  // DELETE (and other) endpoints can return 204 No Content with an empty
  // body, which response.json() would fail to parse.
  if (response.status === 204) {
    return undefined as T
  }
  const text = await response.text()
  return text ? JSON.parse(text) : (undefined as T)
}

export const api = {
  // Auth endpoints
  async register(username: string, password: string, email: string, displayName: string): Promise<{ token: string; user: AuthUser }> {
    const data = await apiRequest<{ token: string; user: DjangoUser }>("auth/register/", {
      method: "POST",
      body: JSON.stringify({ username, password, email, display_name: displayName }),
    })
    setToken(data.token)
    return { token: data.token, user: mapDjangoUser(data.user) }
  },

  async login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const data = await apiRequest<{ token: string; user: DjangoUser }>("auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
    setToken(data.token)
    return { token: data.token, user: mapDjangoUser(data.user) }
  },

  async logout(): Promise<void> {
    setToken(null)
  },

  async updateProfile(displayName: string, email: string): Promise<AuthUser> {
    const data = await apiRequest<{ user: DjangoUser }>("auth/me/", {
      method: "PATCH",
      body: JSON.stringify({ display_name: displayName, email }),
    })
    return mapDjangoUser(data.user)
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiRequest<void>("auth/change-password/", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
  },

  async getMe(): Promise<AuthUser | null> {
    const token = getToken()
    if (!token) return null
    try {
      const data = await apiRequest<{ user: DjangoUser }>("auth/me/")
      return mapDjangoUser(data.user)
    } catch {
      setToken(null)
      return null
    }
  },

  // Rooms endpoints
  async listRooms(): Promise<Room[]> {
    return apiRequest<Room[]>("rooms/")
  },

  async createRoom(name: string, description: string): Promise<Room> {
    return apiRequest<Room>("rooms/", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    })
  },

  async getRoom(roomId: string): Promise<Room> {
    return apiRequest<Room>(`rooms/${roomId}/`)
  },

  async deleteRoom(roomId: string): Promise<void> {
    await apiRequest<void>(`rooms/${roomId}/`, {
      method: "DELETE",
    })
  },

  async togglePinRoom(roomId: string, pinned: boolean): Promise<Room> {
    return apiRequest<Room>(`rooms/${roomId}/`, {
      method: "PATCH",
      body: JSON.stringify({ pinned }),
    })
  },

  // Messages / Chat history
  async getRoomMessages(roomId: string): Promise<Message[]> {
    const djangoMsgs = await apiRequest<any[]>(`rooms/${roomId}/messages/`)
    return djangoMsgs.map(m => ({
      id: m.id,
      room_id: m.room,
      user_id: String(m.user),
      display_name: m.display_name,
      content: m.encrypted_content,
      iv: m.iv,
      created_at: m.created_at
    }))
  },

  // File sharing endpoints
  async listRoomFiles(roomId: string): Promise<SharedFile[]> {
    const djangoFiles = await apiRequest<any[]>(`rooms/${roomId}/files/`)
    return djangoFiles.map(f => ({
      id: f.id,
      room_id: f.room,
      user_id: String(f.user),
      display_name: f.display_name,
      file_name: f.file_name,
      file_size: f.file_size,
      file_type: f.file_type,
      file_url: f.file_url,
      iv: f.iv,
      created_at: f.created_at
    }))
  },

  async uploadFile(roomId: string, file: Blob, fileName: string, fileSize: number, fileType: string, displayName: string, iv: string): Promise<SharedFile> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("file_name", fileName)
    formData.append("file_size", String(fileSize))
    formData.append("file_type", fileType)
    formData.append("display_name", displayName)
    formData.append("iv", iv)

    const f = await apiRequest<any>(`rooms/${roomId}/files/`, {
      method: "POST",
      body: formData,
    })
    return {
      id: f.id,
      room_id: f.room,
      user_id: String(f.user),
      display_name: f.display_name,
      file_name: f.file_name,
      file_size: f.file_size,
      file_type: f.file_type,
      file_url: f.file_url,
      iv: f.iv,
      created_at: f.created_at
    }
  },

  async downloadFile(fileUrl: string): Promise<Blob> {
    const response = await fetch(fileUrl, {
      headers: {
        "Authorization": `Token ${getToken()}`
      }
    })
    if (!response.ok) throw new Error("Failed to download file")
    return response.blob()
  },

  // Scheduled meetings (Calendar)
  async listMeetings(): Promise<ScheduledMeeting[]> {
    return apiRequest<ScheduledMeeting[]>("meetings/")
  },

  async createMeeting(title: string, description: string, scheduledAt: string, durationMinutes: number): Promise<ScheduledMeeting> {
    return apiRequest<ScheduledMeeting>("meetings/", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
      }),
    })
  },

  async deleteMeeting(meetingId: string): Promise<void> {
    await apiRequest<void>(`meetings/${meetingId}/`, {
      method: "DELETE",
    })
  },

  // Recordings
  async listRoomRecordings(roomId: string): Promise<Recording[]> {
    const djangoRecordings = await apiRequest<any[]>(`rooms/${roomId}/recordings/`)
    return djangoRecordings.map(mapDjangoRecording)
  },

  async listAllRecordings(): Promise<Recording[]> {
    const djangoRecordings = await apiRequest<any[]>("recordings/")
    return djangoRecordings.map(mapDjangoRecording)
  },

  async uploadRecording(
    roomId: string,
    encryptedBlob: Blob,
    displayName: string,
    fileSize: number,
    mimeType: string,
    iv: string,
    durationSeconds: number
  ): Promise<Recording> {
    const formData = new FormData()
    formData.append("file", encryptedBlob)
    formData.append("display_name", displayName)
    formData.append("file_size", String(fileSize))
    formData.append("mime_type", mimeType)
    formData.append("iv", iv)
    formData.append("duration_seconds", String(durationSeconds))

    const r = await apiRequest<any>(`rooms/${roomId}/recordings/`, {
      method: "POST",
      body: formData,
    })
    return mapDjangoRecording(r)
  },

  async downloadRecording(fileUrl: string): Promise<Blob> {
    const response = await fetch(fileUrl, {
      headers: {
        "Authorization": `Token ${getToken()}`
      }
    })
    if (!response.ok) throw new Error("Failed to download recording")
    return response.blob()
  },

  async deleteRecording(recordingId: string): Promise<void> {
    await apiRequest<void>(`recordings/${recordingId}/`, {
      method: "DELETE",
    })
  }
}

function mapDjangoRecording(r: any): Recording {
  return {
    id: r.id,
    room_id: r.room,
    room_name: r.room_name,
    created_by: r.created_by,
    created_by_name: r.created_by_name,
    display_name: r.display_name,
    file_url: r.file_url,
    file_size: r.file_size,
    mime_type: r.mime_type,
    iv: r.iv,
    duration_seconds: r.duration_seconds,
    created_at: r.created_at,
  }
}

// Maps Django User model properties to matching Supabase structures
function mapDjangoUser(user: DjangoUser): AuthUser {
  const storedAvatar = typeof localStorage !== 'undefined' ? localStorage.getItem(`user-avatar-${user.id}`) || "" : ""
  return {
    id: String(user.id),
    email: user.email,
    username: user.username,
    user_metadata: {
      display_name: user.first_name || user.username,
      avatar_url: storedAvatar,
    },
  }
}

/**
 * Creates and returns a room WebSocket connection configured for auth token.
 */
export function connectRoomSocket(
  roomId: string,
  onMessage: (msg: any) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket {
  const token = getToken() || ""
  const wsUrl = `${WS_BASE_URL}/room/${roomId}/?token=${encodeURIComponent(token)}`
  const ws = new WebSocket(wsUrl)
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e)
    }
  }

  if (onClose) {
    ws.onclose = onClose
  }

  return ws
}
