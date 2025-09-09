import CryptoJS from 'crypto-js'

// Server-side encryption is now only used for non-E2E data like passwords
// Messages use client-side end-to-end encryption

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key!!'

// Legacy functions kept for backward compatibility and non-E2E data
export const encrypt = (text: string): { encryptedContent: string; iv: string } => {
  const iv = CryptoJS.lib.WordArray.random(16)
  const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return {
    encryptedContent: encrypted.toString(),
    iv: iv.toString(),
  }
}

export const decrypt = (encryptedContent: string, iv: string): string => {
  const decrypted = CryptoJS.AES.decrypt(encryptedContent, ENCRYPTION_KEY, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return decrypted.toString(CryptoJS.enc.Utf8)
}

export const hashPassword = async (password: string): Promise<string> => {
  const hash = CryptoJS.SHA256(password + ENCRYPTION_KEY).toString()
  return hash
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedPassword = CryptoJS.SHA256(password + ENCRYPTION_KEY).toString()
  return hashedPassword === hash
}