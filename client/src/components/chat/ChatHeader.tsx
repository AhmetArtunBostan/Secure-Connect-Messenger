import React from 'react'
import { Phone, Video, MoreVertical, Users } from 'lucide-react'
import Button from '../ui/Button'

interface ChatHeaderProps {
  name: string
  avatar?: string | null
  status: string
  isOnline?: boolean
  participantCount?: number
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  avatar,
  status,
  isOnline,
  participantCount,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Chat Info */}
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Online indicator */}
          {isOnline !== undefined && (
            <div className="absolute -bottom-1 -right-1">
              {isOnline ? (
                <div className="status-online" />
              ) : (
                <div className="status-offline" />
              )}
            </div>
          )}
        </div>

        {/* Name and Status */}
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {name}
          </h2>
          <div className="flex items-center space-x-2">
            {participantCount && (
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                <Users size={14} />
                <span>{participantCount} members</span>
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="p-2">
          <Phone size={18} />
        </Button>
        <Button variant="ghost" size="sm" className="p-2">
          <Video size={18} />
        </Button>
        <Button variant="ghost" size="sm" className="p-2">
          <MoreVertical size={18} />
        </Button>
      </div>
    </div>
  )
}

export default ChatHeader