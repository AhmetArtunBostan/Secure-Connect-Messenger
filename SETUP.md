# SecureConnect Messenger - Setup Guide

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v5.0 or higher)
- **npm** or **yarn**
- **Git**

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd secureconnect-messenger

# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Environment Setup

```bash
# Copy environment file
cd server
cp .env.example .env

# Edit the .env file with your configuration
# Required variables:
# - MONGODB_URI
# - JWT_SECRET
# - ENCRYPTION_KEY
```

### 3. Database Setup

**Option A: Local MongoDB**
```bash
# Start MongoDB service
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# MongoDB will be available at: mongodb://localhost:27017/secureconnect
```

**Option B: Docker MongoDB**
```bash
# Run MongoDB in Docker
docker run -d \
  --name secureconnect-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  -e MONGO_INITDB_DATABASE=secureconnect \
  mongo:7.0

# Update MONGODB_URI in .env:
# MONGODB_URI=mongodb://admin:password123@localhost:27017/secureconnect?authSource=admin
```

### 4. Start Development

```bash
# From project root - starts both client and server
npm run dev

# Or start individually:
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 🐳 Docker Deployment

### Full Stack with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Builds

**Backend:**
```bash
cd server
docker build -t secureconnect-backend .
docker run -p 5000:5000 --env-file .env secureconnect-backend
```

**Frontend:**
```bash
cd client
docker build -t secureconnect-frontend .
docker run -p 3000:80 secureconnect-frontend
```

## 📱 Features Included

### ✅ Implemented Features

- **Authentication & Authorization**
  - User registration and login
  - JWT token-based authentication
  - Password hashing with bcrypt
  - Protected routes

- **Real-time Messaging**
  - Socket.IO integration
  - Instant message delivery
  - Typing indicators
  - Online/offline status

- **Chat Management**
  - Private (1-on-1) chats
  - Group chats
  - Chat creation and management
  - Participant management

- **Message Features**
  - Text messages
  - Message editing (15-minute window)
  - Message deletion
  - Read receipts
  - Message reactions
  - Reply to messages

- **User Interface**
  - Responsive design
  - Dark/light theme
  - Modern chat interface
  - Real-time updates

- **Security**
  - Input validation and sanitization
  - Rate limiting
  - CORS protection
  - Helmet security headers
  - MongoDB injection protection

### 🔄 Future Enhancements

- **File Sharing**
  - Image uploads
  - Document sharing
  - Audio/video messages

- **Advanced Features**
  - End-to-end encryption
  - Voice/video calls
  - Push notifications
  - Message search
  - Chat backup/export

- **Admin Features**
  - User management
  - Chat moderation
  - Analytics dashboard

## 🛠️ Development

### Project Structure

```
secureconnect-messenger/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   ├── services/      # API and Socket services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
│   └── uploads/           # File uploads
├── shared/                # Shared TypeScript types
└── docs/                  # Documentation
```

### Available Scripts

**Root:**
- `npm run dev` - Start both client and server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Lint code

**Client:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Server:**
- `npm run dev` - Start with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Start production server

### Environment Variables

**Server (.env):**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secureconnect
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-character-encryption-key!!
CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔧 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```bash
# Check if MongoDB is running
# Windows: sc query MongoDB
# macOS/Linux: ps aux | grep mongod

# Check connection string in .env
# Ensure database name and credentials are correct
```

**2. Port Already in Use**
```bash
# Find process using port
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -i :3000

# Kill process or change port in package.json
```

**3. CORS Errors**
```bash
# Ensure CORS_ORIGIN in server .env matches client URL
# Default: CORS_ORIGIN=http://localhost:3000
```

**4. Socket Connection Issues**
```bash
# Check if backend is running on correct port
# Verify proxy configuration in vite.config.ts
# Check browser console for WebSocket errors
```

### Performance Optimization

**Production Build:**
```bash
# Build optimized version
npm run build

# Serve with production server
cd server
npm start
```

**Database Indexing:**
- User email and username indexes
- Chat participants index
- Message chatId and timestamp indexes

## 📞 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the GitHub issues
3. Create a new issue with detailed description
4. Include error logs and environment details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.