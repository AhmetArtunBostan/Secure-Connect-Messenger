import React, { useState, useEffect } from 'react'
import { X, Search, UserPlus, Users } from 'lucide-react'
import { userApi, chatApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import toast from 'react-hot-toast'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const { user } = useAuthStore()
  const { addChat } = useChatStore()

  useEffect(() => {
    if (isOpen) {
      loadAllUsers()
    }
  }, [isOpen])

  const loadAllUsers = async () => {
    try {
      setIsLoading(true)
      const response = await userApi.getAllUsers()
      setAllUsers(response.data.data || [])
    } catch (error) {
      console.error('Load users error:', error)
      toast.error('Failed to load contacts')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter users based on search query
  const filteredUsers = allUsers.filter(contact => 
    contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const createPrivateChat = async (contactId: string) => {
    try {
      setIsLoading(true)
      
      const chatData = {
        type: 'private' as const,
        participants: [contactId],
      }

      const response = await chatApi.createChat(chatData)
      addChat(response.data.data)
      
      toast.success('Chat started!')
      onClose()
      
      // Reset form
      setSearchQuery('')
    } catch (error: any) {
      console.error('Create chat error:', error)
      const message = error.response?.data?.message || 'Failed to start chat'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Rehber
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
            <X size={20} />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Input
            placeholder="Kişi ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Kişiler yükleniyor...
            </div>
          ) : filteredUsers.length > 0 ? (
            <div>
              {filteredUsers.map(contact => (
                <div
                  key={contact._id}
                  onClick={() => createPrivateChat(contact._id)}
                  className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                        {contact.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {contact.username}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contact.isOnline ? (
                        <span className="text-green-500">Çevrimiçi</span>
                      ) : (
                        `Son görülme: ${new Date(contact.lastSeen).toLocaleDateString('tr-TR')}`
                      )}
                    </p>
                  </div>
                  {contact.isOnline && (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-4 text-center text-gray-500">
              Kişi bulunamadı
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Henüz kişi yok
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContactModal