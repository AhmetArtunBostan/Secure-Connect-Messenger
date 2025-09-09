import { 
  generateKeyPair, 
  storeKeyPair, 
  getStoredKeyPair, 
  generateAESKey, 
  encryptMessage, 
  decryptMessage, 
  encryptAESKey, 
  decryptAESKey, 
  importPublicKey,
  exportKeyPair,
  KeyPair 
} from '../utils/encryption'
import { userApi } from './api'

export interface EncryptedMessageData {
  encryptedContent: string
  iv: string
  encryptedKeys: { [userId: string]: string } // RSA encrypted AES keys for each participant
}

export interface PublicKeyCache {
  [userId: string]: {
    publicKey: string
    timestamp: number
  }
}

class EncryptionService {
  private keyPair: KeyPair | null = null
  private publicKeyCache: PublicKeyCache = {}
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  // Initialize encryption for user (generate or load keys)
  async initializeForUser(userId: string): Promise<void> {
    try {
      // Try to load existing key pair
      this.keyPair = await getStoredKeyPair(userId)
      
      if (!this.keyPair) {
        // Generate new key pair if none exists
        console.log('Generating new key pair for user:', userId)
        this.keyPair = await generateKeyPair()
        await storeKeyPair(this.keyPair, userId)
        
        // Upload public key to server
        await this.uploadPublicKey(userId)
      }
      
      console.log('Encryption initialized for user:', userId)
    } catch (error) {
      console.error('Failed to initialize encryption:', error)
      throw new Error('Encryption initialization failed')
    }
  }

  // Upload user's public key to server
  private async uploadPublicKey(userId: string): Promise<void> {
    if (!this.keyPair) throw new Error('No key pair available')
    
    try {
      const { publicKey } = await exportKeyPair(this.keyPair)
      await userApi.updateProfile({ publicKey })
      console.log('Public key uploaded to server')
    } catch (error) {
      console.error('Failed to upload public key:', error)
      throw error
    }
  }

  // Get public keys for chat participants
  private async getPublicKeys(participantIds: string[]): Promise<{ [userId: string]: CryptoKey }> {
    const publicKeys: { [userId: string]: CryptoKey } = {}
    const keysToFetch: string[] = []

    // Check cache first
    for (const userId of participantIds) {
      const cached = this.publicKeyCache[userId]
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        try {
          publicKeys[userId] = await importPublicKey(cached.publicKey)
        } catch (error) {
          console.warn(`Failed to import cached key for ${userId}:`, error)
          keysToFetch.push(userId)
        }
      } else {
        keysToFetch.push(userId)
      }
    }

    // Fetch missing keys from server
    if (keysToFetch.length > 0) {
      try {
        for (const userId of keysToFetch) {
          const response = await userApi.getUser(userId)
          const user = response.data.data
          
          if (user.publicKey) {
            // Cache the public key
            this.publicKeyCache[userId] = {
              publicKey: user.publicKey,
              timestamp: Date.now()
            }
            
            // Import and store
            publicKeys[userId] = await importPublicKey(user.publicKey)
          } else {
            console.warn(`No public key found for user ${userId}`)
          }
        }
      } catch (error) {
        console.error('Failed to fetch public keys:', error)
        throw new Error('Failed to get encryption keys for participants')
      }
    }

    return publicKeys
  }

  // Encrypt message for multiple recipients
  async encryptMessageForChat(content: string, participantIds: string[]): Promise<EncryptedMessageData> {
    if (!this.keyPair) {
      throw new Error('Encryption not initialized')
    }

    try {
      // Generate unique AES key for this message
      const aesKey = generateAESKey()
      
      // Encrypt message content with AES
      const { encryptedContent, iv } = encryptMessage(content, aesKey)
      
      // Get public keys for all participants
      const publicKeys = await this.getPublicKeys(participantIds)
      
      // Encrypt AES key for each participant
      const encryptedKeys: { [userId: string]: string } = {}
      
      for (const [userId, publicKey] of Object.entries(publicKeys)) {
        encryptedKeys[userId] = await encryptAESKey(aesKey, publicKey)
      }

      return {
        encryptedContent,
        iv,
        encryptedKeys
      }
    } catch (error) {
      console.error('Message encryption failed:', error)
      throw new Error('Failed to encrypt message')
    }
  }

  // Decrypt message
  async decryptMessage(encryptedData: EncryptedMessageData, userId: string): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Encryption not initialized')
    }

    try {
      // Get the encrypted AES key for this user
      const encryptedAESKey = encryptedData.encryptedKeys[userId]
      if (!encryptedAESKey) {
        throw new Error('No encrypted key found for this user')
      }

      // Decrypt AES key with user's private key
      const aesKey = await decryptAESKey(encryptedAESKey, this.keyPair.privateKey)
      
      // Decrypt message content with AES key
      const decryptedContent = decryptMessage(
        encryptedData.encryptedContent, 
        encryptedData.iv, 
        aesKey
      )

      return decryptedContent
    } catch (error) {
      console.error('Message decryption failed:', error)
      throw new Error('Failed to decrypt message')
    }
  }

  // Clear encryption data (for logout)
  clearEncryptionData(userId: string): void {
    this.keyPair = null
    this.publicKeyCache = {}
    localStorage.removeItem(`keyPair_${userId}`)
  }

  // Check if encryption is ready
  isReady(): boolean {
    return this.keyPair !== null
  }

  // Get user's public key as string (for sharing)
  async getPublicKeyString(): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Encryption not initialized')
    }
    
    const { publicKey } = await exportKeyPair(this.keyPair)
    return publicKey
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService()
export default encryptionService