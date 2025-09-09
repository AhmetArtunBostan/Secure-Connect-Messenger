import User from '../models/User'
import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Hugging Face API integration with AI response system
export class AIService {
  private static readonly HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN || ''
  private static readonly HF_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium'
  private static responses: { [key: string]: string[] } = {
    // Greetings
    'merhaba': ['Hello! How are you?', 'Hi! What\'s up?', 'Hello, welcome!'],
    'selam': ['Hi! How are you?', 'Hello! What are you doing?', 'Hi, welcome!'],
    'hello': ['Hello! How are you?', 'Hi there!', 'Hello, nice to see you!'],
    'hi': ['Hi! How are you?', 'Hello!', 'Hey there!'],
    
    // Well-being
    'nasılsın': ['I\'m good, thanks! How about you?', 'Great! What are you up to?', 'Good, thanks! How are you?'],
    'naber': ['Good, how about you?', 'So-so, how are you?', 'Managing, what are you up to?'],
    'ne yapıyorsun': ['I\'m chatting with you! What are you doing?', 'Just hanging out here, you?', 'We\'re chatting!'],
    'how are you': ['I\'m good, thanks! How about you?', 'Great! What are you up to?', 'I\'m fine, how are you?'],
    
    // Daily conversation
    'ne var ne yok': ['Everything is fine! How are you?', 'Going well, what are you up to?', 'So-so, how about you?'],
    'iyi': ['Great! I\'m good too.', 'Nice! What are you up to then?', 'Super! How\'s your day going?'],
    'kötü': ['I\'m sorry, why are you feeling bad?', 'Get well soon, what happened?', 'I hope you feel better.'],
    'yorgunum': ['Rest a bit, take care of yourself!', 'You\'re working too hard probably?', 'Take a break, I recommend.'],
    
    // Questions and answers
    'kaç yaşındasın': ['Age is just a number! How old are you?', 'My digital age is undefined 😄', 'Guess my age!'],
    'nerelisin': ['From the digital world! Where are you from?', 'I come from the virtual realm!', 'From the internet! Where are you from?'],
    'ne iş yapıyorsun': ['Chatting with you is my job!', 'I\'m a messaging expert!', 'I love chatting!'],
    
    // Fun
    'haha': ['😄 I laughed too!', 'That\'s funny!', '😂 Yes, very funny!'],
    'lol': ['😂 Exactly!', 'Haha yes!', '😄 I\'m dying of laughter!'],
    'şaka': ['Good joke! 😄', 'You\'re funny!', 'You made me laugh! 😂'],
    
    // Farewells
    'görüşürüz': ['See you later! Have a good day!', 'Goodbye!', 'See you again!'],
    'bay': ['Bye bye! Take care of yourself!', 'Goodbye!', 'See you!'],
    'iyi geceler': ['Good night! Sweet dreams!', 'Good night!', 'Sweet dreams!'],
    'bye': ['Bye! Take care!', 'See you later!', 'Goodbye!'],
    
    // For special names
    'anne': ['How is your mom? Say hi from me!', 'Is your mom doing well?', 'Say hi to your mom from me!'],
    'baba': ['How is your dad? Say hello!', 'Is your dad doing well?', 'Say hi to your dad!'],
    'ahmet': ['How is Ahmet? Are you okay, brother?', 'Hi Ahmet! What\'s up?', 'Ahmet! Welcome!'],
    'ayse': ['How are you, Ayşe?', 'Hi Ayşe! What are you doing?', 'Ayşe! Welcome!'],
    'mehmet': ['How are you, Mehmet?', 'Hi Mehmet! What\'s up?', 'Mehmet! Welcome!'],
  }

  private static defaultResponses = [
    'I didn\'t understand, can you say it differently?',
    'Interesting! Can you elaborate?',
    'Hmm, what do you think about this?',
    'I understand! What else?',
    'Yes, continue!',
    'Interesting perspective!',
    'Can you provide more information on this?',
    'I agree! What do you think?'
  ]

  static async generateHuggingFaceResponse(message: string): Promise<string> {
    try {
      const response = await axios.post(
        this.HF_API_URL,
        {
          inputs: message,
          parameters: {
            max_length: 100,
            temperature: 0.7,
            do_sample: true,
            pad_token_id: 50256
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.HF_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      if (response.data && response.data[0] && response.data[0].generated_text) {
        let generatedText = response.data[0].generated_text
        
        // Remove original message, get only the response
        if (generatedText.startsWith(message)) {
          generatedText = generatedText.substring(message.length).trim()
        }
        
        // Empty response check
        if (generatedText.length > 0) {
          return generatedText
        }
      }
      
      // Use fallback if can't get response from API
      return this.getFallbackResponse(message)
    } catch (error) {
      console.error('Hugging Face API error:', error)
      // Use fallback response in case of error
      return this.getFallbackResponse(message)
    }
  }

  static getFallbackResponse(message: string): string {
    const normalizedMessage = message.toLowerCase().trim()
    
    // Keyword search
    for (const [keyword, responses] of Object.entries(this.responses)) {
      if (normalizedMessage.includes(keyword)) {
        const randomIndex = Math.floor(Math.random() * responses.length)
        return responses[randomIndex]
      }
    }
    
    // Default response
    const randomIndex = Math.floor(Math.random() * this.defaultResponses.length)
    return this.defaultResponses[randomIndex]
  }

  static async generateResponse(message: string, senderUsername: string): Promise<string> {
    const normalizedMessage = message.toLowerCase().trim()
    
    // Personal responses
    if (normalizedMessage.includes(senderUsername.toLowerCase())) {
      return `${senderUsername}, it's very nice to talk with you!`
    }
    
    // Try Hugging Face API first
    try {
      const aiResponse = await this.generateHuggingFaceResponse(message)
      return aiResponse
    } catch (error) {
      console.error('AI response error:', error)
      // Use fallback if AI fails
      return this.getFallbackResponse(message)
    }
  }

  static async shouldRespond(chatParticipants: string[], senderId: string): Promise<boolean> {
    // Only respond in 2-person chats
    if (chatParticipants.length !== 2) return false
    
    // Check if sender is one of our test users
    const sender = await User.findById(senderId)
    if (!sender) return false
    
    // Test users list - these are AI bots
    const botUsers = ['anne', 'baba', 'ahmet', 'ayse', 'mehmet']
    
    // Don't respond if sender is a bot user (prevent infinite loop)
    if (botUsers.includes(sender.username)) {
      return false
    }
    
    // Check if other participant is a bot user
    const otherParticipant = chatParticipants.find(id => id !== senderId)
    
    if (otherParticipant) {
      const otherUser = await User.findById(otherParticipant)
      if (otherUser && botUsers.includes(otherUser.username)) {
        return true // Message sent to bot user, respond
      }
    }
    
    return false
  }
}

export default AIService