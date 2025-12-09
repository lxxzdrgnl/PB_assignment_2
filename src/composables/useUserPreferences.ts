import { ref, watch } from 'vue'
import { storage, STORAGE_KEYS } from '@/utils/localStorage'
import { getCurrentUser } from '@/utils/auth'

/**
 * 테마 타입
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * 언어 타입
 */
export type Language = 'ko' | 'en' | 'ja'

/**
 * 정렬 옵션
 */
export type SortOption = 'popularity' | 'rating' | 'release_date' | 'title'

/**
 * 사용자 설정
 */
export interface UserPreferences {
  theme: Theme
  language: Language
  autoPlay: boolean
  showAdultContent: boolean
  defaultSortBy: SortOption
  itemsPerPage: number
  enableNotifications: boolean
  showSpoilers: boolean
}

/**
 * 기본 설정
 */
const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'ko',
  autoPlay: false,
  showAdultContent: false,
  defaultSortBy: 'popularity',
  itemsPerPage: 20,
  enableNotifications: true,
  showSpoilers: false,
}

const preferences = ref<UserPreferences>({ ...defaultPreferences })

/**
 * 사용자별 설정 키 생성
 */
const getUserPreferencesKey = (): string => {
  const user = getCurrentUser()
  return user ? `${STORAGE_KEYS.USER_PREFERENCES}_${user}` : STORAGE_KEYS.USER_PREFERENCES
}

/**
 * 설정 로드
 */
const loadPreferences = (): void => {
  const key = getUserPreferencesKey()
  const stored = storage.getItem<UserPreferences>(key)
  preferences.value = stored ? { ...defaultPreferences, ...stored } : { ...defaultPreferences }
}

/**
 * 설정 저장
 */
const savePreferences = (): void => {
  const key = getUserPreferencesKey()
  storage.setItem(key, preferences.value)
}

export const useUserPreferences = () => {
  /**
   * 테마 설정
   */
  const setTheme = (theme: Theme): void => {
    preferences.value.theme = theme
    savePreferences()
    applyTheme(theme)
  }

  /**
   * 테마 적용
   */
  const applyTheme = (theme: Theme): void => {
    const html = document.documentElement

    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      html.classList.toggle('dark', isDark)
    } else {
      html.classList.toggle('dark', theme === 'dark')
    }
  }

  /**
   * 언어 설정
   */
  const setLanguage = (language: Language): void => {
    preferences.value.language = language
    savePreferences()
    // i18n 설정 변경 로직 추가 가능
  }

  /**
   * 자동 재생 설정
   */
  const setAutoPlay = (enabled: boolean): void => {
    preferences.value.autoPlay = enabled
    savePreferences()
  }

  /**
   * 성인 콘텐츠 표시 설정
   */
  const setShowAdultContent = (show: boolean): void => {
    preferences.value.showAdultContent = show
    savePreferences()
  }

  /**
   * 기본 정렬 방식 설정
   */
  const setDefaultSortBy = (sortBy: SortOption): void => {
    preferences.value.defaultSortBy = sortBy
    savePreferences()
  }

  /**
   * 페이지당 항목 수 설정
   */
  const setItemsPerPage = (count: number): void => {
    preferences.value.itemsPerPage = count
    savePreferences()
  }

  /**
   * 알림 설정
   */
  const setEnableNotifications = (enabled: boolean): void => {
    preferences.value.enableNotifications = enabled
    savePreferences()
  }

  /**
   * 스포일러 표시 설정
   */
  const setShowSpoilers = (show: boolean): void => {
    preferences.value.showSpoilers = show
    savePreferences()
  }

  /**
   * 설정 초기화
   */
  const resetPreferences = (): void => {
    preferences.value = { ...defaultPreferences }
    savePreferences()
    applyTheme(defaultPreferences.theme)
  }

  /**
   * 특정 설정 업데이트
   */
  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void => {
    preferences.value[key] = value
    savePreferences()
  }

  /**
   * 전체 설정 가져오기
   */
  const getPreferences = (): UserPreferences => {
    return { ...preferences.value }
  }

  // 초기 로드
  if (preferences.value.theme === 'system') {
    loadPreferences()
    applyTheme(preferences.value.theme)
  }

  // 시스템 테마 변경 감지
  if (typeof window !== 'undefined') {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    darkModeQuery.addEventListener('change', () => {
      if (preferences.value.theme === 'system') {
        applyTheme('system')
      }
    })
  }

  // 사용자 변경 시 설정 다시 로드
  watch(
    () => getCurrentUser(),
    () => {
      loadPreferences()
      applyTheme(preferences.value.theme)
    }
  )

  return {
    preferences,
    setTheme,
    setLanguage,
    setAutoPlay,
    setShowAdultContent,
    setDefaultSortBy,
    setItemsPerPage,
    setEnableNotifications,
    setShowSpoilers,
    resetPreferences,
    updatePreference,
    getPreferences,
  }
}
