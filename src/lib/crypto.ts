const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * Derives an AES-GCM CryptoKey from a given secret string (e.g., Room ID).
 */
export async function deriveKey(secret: string): Promise<CryptoKey> {
  const secretBytes = encoder.encode(secret)
  
  // Use SHA-256 to stretch/hash the secret to a uniform 256-bit size
  const hash = await window.crypto.subtle.digest("SHA-256", secretBytes)
  
  return window.crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * Encrypts plaintext string using AES-GCM.
 * Returns base64-encoded ciphertext and initialization vector (IV).
 */
export async function encryptText(text: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const encodedText = encoder.encode(text)
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText
  )
  
  // Convert byte arrays to base64
  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  const ivBase64 = btoa(String.fromCharCode(...iv))
  
  return {
    ciphertext: ciphertextBase64,
    iv: ivBase64,
  }
}

/**
 * Decrypts base64-encoded AES-GCM ciphertext.
 * Returns decrypted plaintext.
 */
export async function decryptText(ciphertextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  try {
    const iv = new Uint8Array(atob(ivBase64).split("").map((c) => c.charCodeAt(0)))
    const ciphertext = new Uint8Array(atob(ciphertextBase64).split("").map((c) => c.charCodeAt(0)))
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    )
    
    return decoder.decode(decrypted)
  } catch (error) {
    console.error("Decryption failed:", error)
    return "[Decryption Error - Invalid Key]"
  }
}

/**
 * Encrypts a File blob using AES-GCM.
 * Returns a new Blob representing the encrypted file and the base64 IV.
 */
export async function encryptFile(file: File, key: CryptoKey): Promise<{ encryptedBlob: Blob; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const fileBuffer = await file.arrayBuffer()
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    fileBuffer
  )
  
  const ivBase64 = btoa(String.fromCharCode(...iv))
  const encryptedBlob = new Blob([encrypted], { type: "application/octet-stream" })
  
  return {
    encryptedBlob,
    iv: ivBase64,
  }
}

/**
 * Decrypts an encrypted file Blob.
 * Returns the decrypted file Blob with its original MIME type.
 */
export async function decryptFile(encryptedBlob: Blob, ivBase64: string, fileType: string, key: CryptoKey): Promise<Blob> {
  const iv = new Uint8Array(atob(ivBase64).split("").map((c) => c.charCodeAt(0)))
  const encryptedBuffer = await encryptedBlob.arrayBuffer()
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedBuffer
  )
  
  return new Blob([decrypted], { type: fileType })
}
