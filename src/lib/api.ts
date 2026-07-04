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
  }
}

// Maps Django User model properties to matching Supabase structures
function mapDjangoUser(user: DjangoUser): AuthUser {
  return {
    id: String(user.id),
    email: user.email,
    username: user.username,
    user_metadata: {
      display_name: user.first_name || user.username,
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
