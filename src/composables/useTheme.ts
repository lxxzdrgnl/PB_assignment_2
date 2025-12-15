import { ref, watch, onMounted } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'movieflix_theme'
const currentTheme = ref<Theme>('dark')

export function useTheme() {
  /**
   * 테마 초기화
   */
  const initTheme = () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    currentTheme.value = savedTheme || (prefersDark ? 'dark' : 'light')
    applyTheme(currentTheme.value)
  }

  /**
   * 테마 적용
   */
  const applyTheme = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme)
  }

  /**
   * 테마 토글
   */
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
    applyTheme(currentTheme.value)
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme.value)
  }

  /**
   * 특정 테마로 설정
   */
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    applyTheme(theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }

  /**
   * 시스템 테마 변경 감지
   */
  const watchSystemTheme = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        currentTheme.value = e.matches ? 'dark' : 'light'
        applyTheme(currentTheme.value)
      }
    })
  }

  // 컴포넌트 마운트 시 테마 초기화
  onMounted(() => {
    initTheme()
    watchSystemTheme()
  })

  return {
    currentTheme,
    toggleTheme,
    setTheme,
    initTheme,
  }
}
