# SecureConnect Messenger

A modern, secure real-time messaging platform built with React, Node.js, and Socket.IO.

## 🚀 Features

- **Real-time messaging** with Socket.IO
- **Advanced end-to-end encryption** with RSA/AES hybrid cryptography
- **File sharing** with drag & drop support
- **User presence** status (online/offline/typing)
- **Message history** with MongoDB storage
- **Responsive design** for desktop and mobile
- **Customizable themes** with multiple color schemes and dark/light/system modes
- **Message reactions** and replies
- **Group chats** and private messaging
- **Push notifications**

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Socket.IO Client** for real-time communication
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for server state
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Socket.IO** for WebSocket communication
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Rate limiting** for security

### Security
- **Advanced end-to-end encryption** with hybrid RSA/AES cryptography
  - RSA 2048-bit key pairs for secure key exchange
  - AES-256 for efficient message encryption
  - Unique encryption keys per message
  - Public key infrastructure for multi-recipient encryption
- **HTTPS** in production
- **JWT** token authentication
- **Input validation** and sanitization
- **Rate limiting** and DDoS protection

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd secureconnect-messenger
```

2. Install dependencies:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

3. Set up environment variables:
```bash
cp server/.env.example server/.env
# Edit server/.env with your configuration
```

4. Start MongoDB service

5. Run the application:
```bash
npm run dev
```

## 🏗️ Project Structure

```
secureconnect-messenger/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/         # UI components including ThemeSelector
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Zustand stores
│   │   ├── services/      # API services
│   │   │   └── encryptionService.ts  # End-to-end encryption service
│   │   ├── utils/         # Utility functions
│   │   │   └── encryption.ts  # Cryptographic utilities
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   └── package.json
├── shared/                # Shared types and utilities
└── docs/                  # Documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secureconnect
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-character-encryption-key
CORS_ORIGIN=http://localhost:3000
```

## 🎨 Theme System

SecureConnect Messenger now features a comprehensive theme system:

### Features
- **Multiple color schemes**: Choose from various predefined color themes
- **Light/Dark/System modes**: Automatically sync with system preferences or manually select
- **Persistent preferences**: User theme choices are saved between sessions
- **Compact mode**: Simplified theme selector for minimal UI

### Implementation
- Located in `client/src/components/ui/ThemeSelector.tsx`
- Integrated with Zustand store for state management
- Fully responsive design with smooth transitions

## 🔒 End-to-End Encryption

The application implements a robust end-to-end encryption system:

### Key Features
- **Hybrid cryptography**: RSA for key exchange, AES for message encryption
- **Per-message encryption**: Each message uses a unique AES key
- **Multi-recipient support**: Messages in group chats are encrypted for each participant
- **Key management**: Automatic key generation, storage, and retrieval
- **Public key infrastructure**: Exchange of public keys for secure communication

### Implementation
- **Encryption Service**: `client/src/services/encryptionService.ts`
  - Manages key pairs, public key caching, and encryption/decryption operations
- **Cryptographic Utilities**: `client/src/utils/encryption.ts`
  - Low-level cryptographic functions using Web Crypto API and CryptoJS
- **Secure Storage**: Keys are stored securely and never transmitted in plaintext

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

## 📱 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Messages
- `GET /api/messages/:chatId` - Get chat messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

### Chats
- `GET /api/chats` - Get user chats
- `POST /api/chats` - Create new chat
- `PUT /api/chats/:id` - Update chat
- `DELETE /api/chats/:id` - Delete chat

## 🧪 Testing

```bash
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@secureconnect.com or join our Slack channel.