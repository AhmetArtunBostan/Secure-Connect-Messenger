// Debug script to test login
const bcrypt = require('bcryptjs')

async function testPassword() {
  const password = 'Test123456'
  
  // Hash the password (same as in User model)
  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(password, salt)
  
  console.log('Original password:', password)
  console.log('Hashed password:', hashedPassword)
  
  // Test comparison
  const isValid = await bcrypt.compare(password, hashedPassword)
  console.log('Password comparison result:', isValid)
  
  // Test with wrong password
  const isWrong = await bcrypt.compare('wrongpassword', hashedPassword)
  console.log('Wrong password comparison:', isWrong)
}

testPassword().catch(console.error)