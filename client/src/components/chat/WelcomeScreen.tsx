import React from 'react'
import { MessageCircle, Shield, Zap, Users } from 'lucide-react'

const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
            <MessageCircle className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to SecureConnect
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select a chat to start messaging or create a new conversation
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 text-left">
          <div className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
            <Shield className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">End-to-End Encrypted</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your messages are secured with military-grade encryption
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
            <Zap className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Real-time Messaging</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Instant delivery with typing indicators and read receipts
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
            <Users className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Group Chats</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create groups and collaborate with multiple people
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            SecureConnect Messenger v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen