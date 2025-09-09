import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'
type ColorTheme = 'ocean' | 'rose' | 'nature' | 'sunset' | 'purple' | 'electric'

interface ThemeState {
  theme: Theme
  actualTheme: 'light' | 'dark'
  colorTheme: ColorTheme
}

interface ThemeActions {
  setTheme: (theme: Theme) => void
  setColorTheme: (colorTheme: ColorTheme) => void
  toggleTheme: () => void
  applyTheme: () => void
}

type ThemeStore = ThemeState & ThemeActions

export const themeConfig = {
  ocean: {
    name: 'Ocean Blue',
    icon: '🌊',
    description: 'Cool and professional ocean vibes',
    primary: '#0ea5e9',
    secondary: '#a855f7'
  },
  rose: {
    name: 'Rose Pink',
    icon: '🌹',
    description: 'Warm and romantic rose tones',
    primary: '#f43f5e',
    secondary: '#f97316'
  },
  nature: {
    name: 'Nature Green',
    icon: '🍃',
    description: 'Fresh and natural green harmony',
    primary: '#22c55e',
    secondary: '#06b6d4'
  },
  sunset: {
    name: 'Sunset Orange',
    icon: '🌅',
    description: 'Energetic sunset warmth',
    primary: '#f97316',
    secondary: '#ef4444'
  },
  purple: {
    name: 'Deep Purple',
    icon: '💜',
    description: 'Elegant and mysterious purple',
    primary: '#a855f7',
    secondary: '#d946ef'
  },
  electric: {
    name: 'Electric Yellow',
    icon: '⚡',
    description: 'Vibrant and energetic glow',
    primary: '#eab308',
    secondary: '#22c55e'
  }
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

const getActualTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // State
      theme: 'system',
      actualTheme: getSystemTheme(),
      colorTheme: 'ocean',

      // Actions
      setTheme: (theme: Theme) => {
        const actualTheme = getActualTheme(theme)
        set({ theme, actualTheme })
        get().applyTheme()
      },

      setColorTheme: (colorTheme: ColorTheme) => {
        set({ colorTheme })
        get().applyTheme()
      },

      toggleTheme: () => {
        const { actualTheme } = get()
        const newTheme = actualTheme === 'light' ? 'dark' : 'light'
        set({ theme: newTheme, actualTheme: newTheme })
        get().applyTheme()
      },

      applyTheme: () => {
        const { actualTheme, colorTheme } = get()
        const root = document.documentElement
        
        // Apply dark/light mode
        if (actualTheme === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
        
        // Remove existing theme classes
        root.classList.remove('theme-ocean', 'theme-rose', 'theme-nature', 'theme-sunset', 'theme-purple', 'theme-electric')
        
        // Apply new theme class
        root.classList.add(`theme-${colorTheme}`)
        
        // Apply color theme data attribute
        root.setAttribute('data-theme', colorTheme)
        
        // Themes are now handled by CSS classes - much simpler!
        
        // Add smooth transition for theme changes
        root.style.transition = 'background-color 0.3s ease, color 0.3s ease'
        
        console.log('Theme applied:', { actualTheme, colorTheme, themeClass: `theme-${colorTheme}` }) // Debug
      }
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme, colorTheme: state.colorTheme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Update actual theme on rehydration
          state.actualTheme = getActualTheme(state.theme)
          // Apply theme immediately
          setTimeout(() => state.applyTheme(), 0)
        }
      },
    }
  )
)

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const { theme, setTheme } = useThemeStore.getState()
    if (theme === 'system') {
      setTheme('system') // This will update actualTheme
    }
  })
}

// Export types for components
export type { Theme, ColorTheme }