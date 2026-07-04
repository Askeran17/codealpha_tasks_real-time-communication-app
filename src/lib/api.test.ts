import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api, getToken, setToken } from "./api"

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: "",
    json: async () => body,
  } as Response
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
      user_metadata: { display_name: "Jane" },
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
})
