import React, { useState } from 'react'
import { Check, Palette, Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore, themeConfig, type ColorTheme, type Theme } from '../../store/themeStore'
import Button from './Button'

interface ThemeSelectorProps {
  onClose?: () => void
  compact?: boolean
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose, compact = false }) => {
  const { theme, actualTheme, colorTheme, setTheme, setColorTheme } = useThemeStore()
  const [activeTab, setActiveTab] = useState<'mode' | 'color'>('color')

  const themeOptions: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: 'Light', icon: <Sun size={20} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={20} /> },
    { value: 'system', label: 'System', icon: <Monitor size={20} /> },
  ]

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {/* Quick Color Theme Selector */}
        <div className="flex items-center space-x-1">
          {Object.entries(themeConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setColorTheme(key as ColorTheme)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all duration-200 hover:scale-110 ${
                colorTheme === key
                  ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800 scale-110'
                  : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
              }`}
              style={{ backgroundColor: config.primary }}
              title={config.name}
            >
              {colorTheme === key && <Check size={16} className="text-white" />}
            </button>
          ))}
        </div>
        
        {/* Dark/Light Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(actualTheme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-lg"
        >
          {actualTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Palette className="text-primary-600 dark:text-primary-400" size={24} />
          <span>Customize Theme</span>
        </h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            ×
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('color')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'color'
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-soft'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Palette size={16} />
          <span>Colors</span>
        </button>
        <button
          onClick={() => setActiveTab('mode')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'mode'
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-soft'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {actualTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          <span>Mode</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'color' && (
        <div className="space-y-6 animate-fade-in">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose your preferred color theme
          </p>
          
          {/* Quick Color Palette */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Colors</h4>
            <div className="flex items-center space-x-2">
              {Object.entries(themeConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setColorTheme(key as ColorTheme)}
                  className={`relative w-10 h-10 rounded-lg transition-all duration-200 hover:scale-110 shadow-medium ${
                    colorTheme === key
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-800 scale-110'
                      : 'hover:ring-2 hover:ring-white hover:ring-offset-2 hover:ring-offset-gray-100 dark:hover:ring-offset-gray-800'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${config.primary} 0%, ${config.secondary} 100%)`
                  }}
                  title={config.name}
                >
                  {colorTheme === key && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check size={16} className="text-white drop-shadow-lg" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 text-xs">
                    {config.icon}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Detailed Theme Cards */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(themeConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setColorTheme(key as ColorTheme)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 group ${
                  colorTheme === key
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                {/* Color Preview */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-lg shadow-medium"
                      style={{
                        background: `linear-gradient(135deg, ${config.primary} 0%, ${config.secondary} 100%)`
                      }}
                    />
                    {colorTheme === key && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check size={14} className="text-white drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                  <div className="text-xl">{config.icon}</div>
                </div>
                
                {/* Theme Info */}
                <div className="text-left">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {config.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                    {config.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mode' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose your preferred display mode
          </p>
          <div className="space-y-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`w-full flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-102 ${
                  theme === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  theme === option.value
                    ? 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.value === 'light' && 'Clean and minimal light interface'}
                    {option.value === 'dark' && 'Easy on the eyes dark interface'}
                    {option.value === 'system' && 'Automatically match your system preference'}
                  </div>
                </div>
                {theme === option.value && (
                  <Check size={20} className="text-primary-600 dark:text-primary-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl border border-primary-200/50 dark:border-primary-700/50">
        <div className="flex items-center space-x-2 text-sm text-primary-700 dark:text-primary-300">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-subtle"></div>
          <span>Theme applied successfully!</span>
        </div>
      </div>
    </div>
  )
}

export default ThemeSelector