import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User'
import { connectDB } from '../config/database'

const seedUsers = async () => {
  try {
    await connectDB()
    
    // Test kullanıcıları
    const testUsers = [
      {
        username: 'anne',
        email: 'anne@example.com',
        password: await bcrypt.hash('12345678', 12),
        isOnline: false,
        lastSeen: new Date(),
      },
      {
        username: 'baba',
        email: 'baba@example.com',
        password: await bcrypt.hash('12345678', 12),
        isOnline: false,
        lastSeen: new Date(),
      },
      {
        username: 'ahmet',
        email: 'ahmet@example.com',
        password: await bcrypt.hash('12345678', 12),
        isOnline: false,
        lastSeen: new Date(),
      },
      {
        username: 'ayse',
        email: 'ayse@example.com',
        password: await bcrypt.hash('12345678', 12),
        isOnline: false,
        lastSeen: new Date(),
      },
      {
        username: 'mehmet',
        email: 'mehmet@example.com',
        password: await bcrypt.hash('12345678', 12),
        isOnline: false,
        lastSeen: new Date(),
      }
    ]

    // Mevcut test kullanıcılarını sil
    await User.deleteMany({
      email: { $in: testUsers.map(u => u.email) }
    })

    // Yeni kullanıcıları ekle
    const createdUsers = await User.insertMany(testUsers)
    
    console.log('✅ Test kullanıcıları başarıyla eklendi:')
    createdUsers.forEach(user => {
      console.log(`- ${user.username} (${user.email})`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Hata:', error)
    process.exit(1)
  }
}

seedUsers()