import { describe, expect, it } from "vitest"
import { decryptFile, decryptText, deriveKey, encryptFile, encryptText } from "./crypto"

describe("deriveKey", () => {
  it("derives the same key material from the same secret", async () => {
    const keyA = await deriveKey("room-123")
    const keyB = await deriveKey("room-123")
    const message = "hello room"

    const { ciphertext, iv } = await encryptText(message, keyA)
    const decrypted = await decryptText(ciphertext, iv, keyB)

    expect(decrypted).toBe(message)
  })

  it("derives different keys from different secrets", async () => {
    const keyA = await deriveKey("room-123")
    const keyB = await deriveKey("room-456")
    const { ciphertext, iv } = await encryptText("secret message", keyA)

    const decrypted = await decryptText(ciphertext, iv, keyB)

    expect(decrypted).toBe("[Decryption Error - Invalid Key]")
  })
})

describe("encryptText / decryptText", () => {
  it("round-trips plaintext through encryption and decryption", async () => {
    const key = await deriveKey("shared-secret")
    const plaintext = "The quick brown fox jumps over the lazy dog. 🦊"

    const { ciphertext, iv } = await encryptText(plaintext, key)
    expect(ciphertext).not.toContain(plaintext)

    const decrypted = await decryptText(ciphertext, iv, key)
    expect(decrypted).toBe(plaintext)
  })

  it("produces a different IV for every encryption call", async () => {
    const key = await deriveKey("shared-secret")

    const first = await encryptText("same message", key)
    const second = await encryptText("same message", key)

    expect(first.iv).not.toBe(second.iv)
    expect(first.ciphertext).not.toBe(second.ciphertext)
  })

  it("fails gracefully instead of throwing when the IV is wrong", async () => {
    const key = await deriveKey("shared-secret")
    const { ciphertext } = await encryptText("tampered", key)

    const decrypted = await decryptText(ciphertext, "AAAAAAAAAAAAAAAAAAAA", key)

    expect(decrypted).toBe("[Decryption Error - Invalid Key]")
  })
})

describe("encryptFile / decryptFile", () => {
  it("round-trips a file's contents and preserves its MIME type", async () => {
    const key = await deriveKey("room-file-secret")
    const original = new File(["file contents to encrypt"], "note.txt", { type: "text/plain" })

    const { encryptedBlob, iv } = await encryptFile(original, key)
    expect(encryptedBlob.type).toBe("application/octet-stream")

    const decryptedBlob = await decryptFile(encryptedBlob, iv, "text/plain", key)
    const decryptedText = await decryptedBlob.text()

    expect(decryptedBlob.type).toBe("text/plain")
    expect(decryptedText).toBe("file contents to encrypt")
  })
})
