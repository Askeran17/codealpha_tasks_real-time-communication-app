import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api, getToken, setToken } from "./api"

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: "",
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response
}

function noContentResponse() {
  return {
    ok: true,
    status: 204,
    statusText: "",
    json: async () => {
      throw new Error("no body to parse")
    },
    text: async () => "",
  } as unknown as Response
}

function blobResponse(blob: Blob, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: "",
    blob: async () => blob,
  } as unknown as Response
}

describe("token storage", () => {
  afterEach(() => {
    localStorage.clear()
  })

  it("stores and retrieves the auth token", () => {
    setToken("abc123")
    expect(getToken()).toBe("abc123")
  })

  it("removes the token when set to null", () => {
    setToken("abc123")
    setToken(null)
    expect(getToken()).toBeNull()
  })
})

describe("api", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("stores the token returned by register and maps the user shape", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        token: "new-token",
        user: { id: 1, username: "jane", email: "jane@example.com", first_name: "Jane", last_name: "" },
      })
    )

    const result = await api.register("jane", "password123", "jane@example.com", "Jane")

    expect(result.token).toBe("new-token")
    expect(result.user).toEqual({
      id: "1",
      email: "jane@example.com",
      username: "jane",
      // mapDjangoUser always reads a locally-stored avatar (defaulting to ""
      // when none is set yet), so it's always present in user_metadata.
      user_metadata: { display_name: "Jane", avatar_url: "" },
    })
    expect(getToken()).toBe("new-token")
  })

  it("sends credentials to the login endpoint and stores the returned token", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        token: "session-token",
        user: { id: 2, username: "bob", email: "bob@example.com", first_name: "", last_name: "" },
      })
    )

    await api.login("bob", "hunter2")

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain("auth/login/")
    expect(options?.method).toBe("POST")
    expect(JSON.parse(options?.body as string)).toEqual({ username: "bob", password: "hunter2" })
    expect(getToken()).toBe("session-token")
  })

  it("returns null from getMe without calling the API when there is no token", async () => {
    const user = await api.getMe()

    expect(user).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("clears the token and returns null when getMe receives an error response", async () => {
    setToken("expired-token")
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: "Invalid token" }, { ok: false, status: 401 }))

    const user = await api.getMe()

    expect(user).toBeNull()
    expect(getToken()).toBeNull()
  })

  it("throws the server-provided error message when a request fails", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ error: "Room not found" }, { ok: false, status: 404 })
    )

    await expect(api.getRoom("missing-room")).rejects.toThrow("Room not found")
  })

  it("resolves deleteRoom without parsing a 204 No Content body", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(noContentResponse())

    await expect(api.deleteRoom("room-1")).resolves.toBeUndefined()
  })

  it("maps Django room message fields into the frontend Message shape", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse([
        { id: "m1", room: "room-1", user: 5, display_name: "Jane", encrypted_content: "cipher", iv: "iv1", created_at: "2026-01-01" },
      ])
    )

    const messages = await api.getRoomMessages("room-1")

    expect(messages).toEqual([
      { id: "m1", room_id: "room-1", user_id: "5", display_name: "Jane", content: "cipher", iv: "iv1", created_at: "2026-01-01" },
    ])
  })

  it("omits the search query param from listUsers when no search term is given", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))

    await api.listUsers()

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).not.toContain("?search=")
  })

  it("encodes the search term as a query param on listUsers", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))

    await api.listUsers("jane doe")

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain("users/?search=jane%20doe")
  })

  it("posts the meeting fields with a snake_case body on createMeeting", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        id: "meeting-1", room_id: "room-1", room_name: "Design Sync", room_description: null,
        created_by: 1, scheduled_at: "2026-08-01T10:00:00Z", duration_minutes: 45, created_at: "2026-07-01T00:00:00Z",
      })
    )

    const meeting = await api.createMeeting("Design Sync", "", "2026-08-01T10:00:00Z", 45)

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain("meetings/")
    expect(JSON.parse(options?.body as string)).toEqual({
      title: "Design Sync", description: "", scheduled_at: "2026-08-01T10:00:00Z", duration_minutes: 45,
    })
    expect(meeting.room_name).toBe("Design Sync")
  })

  it("resolves deleteMeeting without parsing a 204 No Content body", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(noContentResponse())

    await expect(api.deleteMeeting("meeting-1")).resolves.toBeUndefined()
  })

  it("maps the Django recording's room field to room_id on listAllRecordings", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse([
        {
          id: "rec-1", room: "room-1", room_name: "Standup", created_by: 1, created_by_name: "jane",
          display_name: "Recording", file_url: "http://example.com/rec.webm", file_size: 100,
          mime_type: "video/webm", iv: "iv1", duration_seconds: 30, created_at: "2026-07-01T00:00:00Z",
        },
      ])
    )

    const recordings = await api.listAllRecordings()

    expect(recordings).toEqual([
      {
        id: "rec-1", room_id: "room-1", room_name: "Standup", created_by: 1, created_by_name: "jane",
        display_name: "Recording", file_url: "http://example.com/rec.webm", file_size: 100,
        mime_type: "video/webm", iv: "iv1", duration_seconds: 30, created_at: "2026-07-01T00:00:00Z",
      },
    ])
  })

  it("uploads a recording as multipart form data with the encrypted blob and metadata", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        id: "rec-1", room: "room-1", room_name: "Standup", created_by: 1, created_by_name: "jane",
        display_name: "My Recording", file_url: "http://example.com/rec.webm", file_size: 5,
        mime_type: "video/webm", iv: "iv1", duration_seconds: 12, created_at: "2026-07-01T00:00:00Z",
      })
    )
    const blob = new Blob(["encrypted"], { type: "application/octet-stream" })

    const recording = await api.uploadRecording("room-1", blob, "My Recording", 5, "video/webm", "iv1", 12)

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain("rooms/room-1/recordings/")
    expect(options?.body).toBeInstanceOf(FormData)
    const body = options?.body as FormData
    expect(body.get("display_name")).toBe("My Recording")
    expect(body.get("duration_seconds")).toBe("12")
    expect(recording.room_id).toBe("room-1")
  })

  it("downloads a recording blob with the auth header", async () => {
    setToken("auth-token")
    const blob = new Blob(["decrypted-bytes"])
    vi.mocked(fetch).mockResolvedValueOnce(blobResponse(blob))

    const result = await api.downloadRecording("http://example.com/rec.webm")

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe("http://example.com/rec.webm")
    expect((options?.headers as Record<string, string>)?.Authorization).toBe("Token auth-token")
    expect(result).toBe(blob)
  })

  it("throws when downloadRecording receives a failed response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(blobResponse(new Blob([]), { ok: false, status: 404 }))

    await expect(api.downloadRecording("http://example.com/missing.webm")).rejects.toThrow("Failed to download recording")
  })

  it("resolves deleteRecording without parsing a 204 No Content body", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(noContentResponse())

    await expect(api.deleteRecording("rec-1")).resolves.toBeUndefined()
  })

  it("sends a PATCH with the pinned flag on togglePinRoom", async () => {
    setToken("some-token")
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ id: "room-1", name: "Room", description: null, created_by: 1, created_at: "2026-07-01T00:00:00Z", is_active: true, pinned: true })
    )

    await api.togglePinRoom("room-1", true)

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain("rooms/room-1/")
    expect(options?.method).toBe("PATCH")
    expect(JSON.parse(options?.body as string)).toEqual({ pinned: true })
  })
})
