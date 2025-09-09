import React from 'react'
import { format } from 'date-fns'
import { Message } from '@shared/types'
import { Check, CheckCheck, Edit, Reply } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showSender: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showSender,
}) => {
  const formatTime = (date: string) => {
    return format(new Date(date), 'HH:mm')
  }

  const isRead = message.readBy.length > 1 // More than just the sender

  return (
    <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end`}>
        {/* Avatar */}
        {!isOwn && showSender && (
          <div className="avatar avatar-sm bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mr-2 flex-shrink-0 shadow-soft hover-lift">
            {message.senderId.avatar ? (
              <img
                src={message.senderId.avatar}
                alt={message.senderId.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-white">
                {message.senderId.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
        )}

        {/* Spacer for alignment */}
        {!isOwn && !showSender && <div className="w-10" />}

        {/* Message Content */}
        <div className="flex flex-col">
          {/* Sender name */}
          {!isOwn && showSender && (
            <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-3 font-medium">
              {message.senderId.username}
            </span>
          )}

          {/* Reply indicator */}
          {message.replyTo && (
            <div className="mb-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-primary-500">
              <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                <Reply size={12} />
                <span>Replying to message</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                Original message content...
              </p>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`relative px-4 py-3 rounded-2xl shadow-soft transition-all duration-200 hover:shadow-medium ${
              isOwn 
                ? 'bg-primary-500 text-white rounded-br-md' 
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-md'
            }`}
          >
            {/* Message tail */}
            <div className={`absolute bottom-0 w-3 h-3 ${
              isOwn 
                ? '-right-1 bg-primary-500 transform rotate-45 translate-y-1' 
                : '-left-1 bg-white dark:bg-gray-700 border-l border-b border-gray-200 dark:border-gray-600 transform rotate-45 translate-y-1'
            }`} />

            {/* Message content */}
            <div className="relative z-10 break-words">
              {message.type === 'text' ? (
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="capitalize">{message.type}</span>
                  <span className="text-sm opacity-75">message</span>
                </div>
              )}
            </div>

            {/* Message footer */}
            <div className={`flex items-center justify-end space-x-1 mt-2 text-xs ${
              isOwn ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {message.isEdited && (
                <Edit size={12} className="opacity-60" />
              )}
              <span className="font-medium">{formatTime(message.createdAt)}</span>
              {isOwn && (
                <div className="flex items-center ml-1">
                  {isRead ? (
                    <CheckCheck size={14} className="text-white/90" />
                  ) : (
                    <Check size={14} className="text-white/70" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.reduce((acc: any[], reaction) => {
                const existing = acc.find(r => r.emoji === reaction.emoji)
                if (existing) {
                  existing.count++
                  existing.users.push(reaction.userId)
                } else {
                  acc.push({
                    emoji: reaction.emoji,
                    count: 1,
                    users: [reaction.userId],
                  })
                }
                return acc
              }, []).map((reaction, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {reaction.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble