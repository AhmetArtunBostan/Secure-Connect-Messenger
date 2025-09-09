import CryptoJS from 'crypto-js'

// RSA key pair generation using Web Crypto API
export interface KeyPair {
  publicKey: CryptoKey
  privateKey: CryptoKey
}

export interface SerializedKeyPair {
  publicKey: string
  privateKey: string
}

// Generate RSA key pair for each user
export const generateKeyPair = async (): Promise<KeyPair> => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
  
  return keyPair
}

// Export keys to string format for storage
export const exportKeyPair = async (keyPair: KeyPair): Promise<SerializedKeyPair> => {
  const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
  const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  
  return {
    publicKey: arrayBufferToBase64(publicKeyBuffer),
    privateKey: arrayBufferToBase64(privateKeyBuffer)
  }
}

// Import keys from string format
export const importKeyPair = async (serializedKeys: SerializedKeyPair): Promise<KeyPair> => {
  const publicKeyBuffer = base64ToArrayBuffer(serializedKeys.publicKey)
  const privateKeyBuffer = base64ToArrayBuffer(serializedKeys.privateKey)
  
  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  )
  
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  )
  
  return { publicKey, privateKey }
}

// Import public key only (for encrypting messages to other users)
export const importPublicKey = async (publicKeyString: string): Promise<CryptoKey> => {
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyString)
  
  return await window.crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  )
}

// Generate random AES key for message encryption
export const generateAESKey = (): string => {
  return CryptoJS.lib.WordArray.random(32).toString() // 256-bit key
}

// Encrypt message content with AES
export const encryptMessage = (content: string, aesKey: string): { encryptedContent: string; iv: string } => {
  const iv = CryptoJS.lib.WordArray.random(16)
  const encrypted = CryptoJS.AES.encrypt(content, aesKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return {
    encryptedContent: encrypted.toString(),
    iv: iv.toString(),
  }
}

// Decrypt message content with AES
export const decryptMessage = (encryptedContent: string, iv: string, aesKey: string): string => {
  const decrypted = CryptoJS.AES.decrypt(encryptedContent, aesKey, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return decrypted.toString(CryptoJS.enc.Utf8)
}

// Encrypt AES key with RSA public key
export const encryptAESKey = async (aesKey: string, publicKey: CryptoKey): Promise<string> => {
  const keyBuffer = new TextEncoder().encode(aesKey)
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    keyBuffer
  )
  
  return arrayBufferToBase64(encryptedBuffer)
}

// Decrypt AES key with RSA private key
export const decryptAESKey = async (encryptedKey: string, privateKey: CryptoKey): Promise<string> => {
  const encryptedBuffer = base64ToArrayBuffer(encryptedKey)
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    encryptedBuffer
  )
  
  return new TextDecoder().decode(decryptedBuffer)
}

// Utility functions
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Store keys securely in localStorage (in production, consider more secure storage)
export const storeKeyPair = async (keyPair: KeyPair, userId: string): Promise<void> => {
  const serializedKeys = await exportKeyPair(keyPair)
  localStorage.setItem(`keyPair_${userId}`, JSON.stringify(serializedKeys))
}

// Retrieve keys from storage
export const getStoredKeyPair = async (userId: string): Promise<KeyPair | null> => {
  const stored = localStorage.getItem(`keyPair_${userId}`)
  if (!stored) return null
  
  try {
    const serializedKeys: SerializedKeyPair = JSON.parse(stored)
    return await importKeyPair(serializedKeys)
  } catch (error) {
    console.error('Error retrieving key pair:', error)
    return null
  }
}

// Clear stored keys (for logout)
export const clearStoredKeys = (userId: string): void => {
  localStorage.removeItem(`keyPair_${userId}`)
}