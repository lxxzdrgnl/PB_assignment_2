/**
 * 고급 Local Storage 유틸리티 클래스
 * - 데이터 암호화/복호화
 * - 유효기간 관리
 * - 에러 핸들링
 * - 타입 안전성
 * - 용량 관리
 */

// Storage 키 네이밍 규칙
export const STORAGE_KEYS = {
  // 인증 관련
  AUTH_USERS: 'movie_app_users',
  AUTH_CURRENT_USER: 'movie_app_current_user',
  AUTH_IS_LOGGED_IN: 'movie_app_is_logged_in',
  AUTH_KEEP_LOGIN: 'movie_app_keep_login',
  AUTH_TOKEN: 'movie_app_token',
  AUTH_SESSION_EXPIRY: 'movie_app_session_expiry',

  // 사용자 데이터
  USER_WISHLIST: 'movie_app_wishlist',
  USER_WATCH_HISTORY: 'movie_app_watch_history',
  USER_SEARCH_HISTORY: 'movie_app_search_history',
  USER_PREFERENCES: 'movie_app_preferences',
  USER_SETTINGS: 'movie_app_settings',

  // API 캐싱
  CACHE_MOVIES: 'movie_app_cache_movies',
  CACHE_GENRES: 'movie_app_cache_genres',
  CACHE_POPULAR: 'movie_app_cache_popular',
  CACHE_TRENDING: 'movie_app_cache_trending',
  CACHE_MOVIE_DETAILS: 'movie_app_cache_movie_details',

  // 메타데이터
  STORAGE_VERSION: 'movie_app_storage_version',
  LAST_CLEANUP: 'movie_app_last_cleanup',
} as const

// Storage 버전 (데이터 구조 변경 시 증가)
const CURRENT_STORAGE_VERSION = '1.0.0'

// 캐시 유효기간 (밀리초)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5분
  MEDIUM: 30 * 60 * 1000, // 30분
  LONG: 24 * 60 * 60 * 1000, // 24시간
  WEEK: 7 * 24 * 60 * 60 * 1000, // 1주일
} as const

// 저장할 데이터의 인터페이스
interface StorageData<T> {
  value: T | string // 암호화된 경우 string
  timestamp: number
  expiresAt?: number
  version: string
  encrypted?: boolean
}

// Storage 에러 타입
export class StorageError extends Error {
  constructor(
    message: string,
    public code: 'QUOTA_EXCEEDED' | 'INVALID_DATA' | 'PARSE_ERROR' | 'NOT_SUPPORTED'
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

/**
 * Local Storage 관리 클래스
 */
export class LocalStorageManager {
  private static instance: LocalStorageManager
  private isSupported: boolean

  private constructor() {
    this.isSupported = this.checkSupport()
    this.initialize()
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager()
    }
    return LocalStorageManager.instance
  }

  /**
   * Local Storage 지원 여부 확인
   */
  private checkSupport(): boolean {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (e) {
      console.warn('Local Storage is not supported:', e)
      return false
    }
  }

  /**
   * Storage 초기화
   */
  private initialize(): void {
    if (!this.isSupported) return

    // 버전 확인 및 마이그레이션
    const currentVersion = this.getItem<string>(STORAGE_KEYS.STORAGE_VERSION)
    if (currentVersion !== CURRENT_STORAGE_VERSION) {
      this.migrate(currentVersion)
      this.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_STORAGE_VERSION)
    }

    // 정기적인 정리 (24시간마다)
    this.autoCleanup()
  }

  /**
   * 데이터 저장
   */
  public setItem<T>(
    key: string,
    value: T,
    options?: {
      expiresIn?: number // 유효기간 (밀리초)
      encrypt?: boolean // 암호화 여부
    }
  ): boolean {
    if (!this.isSupported) {
      console.warn('Local Storage is not supported')
      return false
    }

    try {
      const data: StorageData<T> = {
        value: options?.encrypt ? this.encrypt(value) : value,
        timestamp: Date.now(),
        expiresAt: options?.expiresIn ? Date.now() + options.expiresIn : undefined,
        version: CURRENT_STORAGE_VERSION,
        encrypted: options?.encrypt,
      }

      const serialized = JSON.stringify(data)
      localStorage.setItem(key, serialized)
      return true
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded')
        this.handleQuotaExceeded()
        throw new StorageError('Storage quota exceeded', 'QUOTA_EXCEEDED')
      }
      console.error('Failed to save to storage:', e)
      return false
    }
  }

  /**
   * 데이터 가져오기
   */
  public getItem<T>(key: string): T | null {
    if (!this.isSupported) {
      return null
    }

    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const data: StorageData<T> = JSON.parse(item)

      // 유효기간 체크
      if (data.expiresAt && Date.now() > data.expiresAt) {
        this.removeItem(key)
        return null
      }

      // 암호화된 데이터 복호화
      if (data.encrypted) {
        return this.decrypt(data.value) as T
      }

      return data.value as T
    } catch (e) {
      console.error('Failed to get from storage:', e)
      this.removeItem(key) // 손상된 데이터 제거
      return null // 오류 발생 시 null 반환하여 앱 중단 방지
    }
  }

  /**
   * 데이터 삭제
   */
  public removeItem(key: string): void {
    if (!this.isSupported) return
    localStorage.removeItem(key)
  }

  /**
   * 모든 데이터 삭제
   */
  public clear(): void {
    if (!this.isSupported) return
    localStorage.clear()
  }

  /**
   * 특정 prefix로 시작하는 모든 키 삭제
   */
  public clearByPrefix(prefix: string): void {
    if (!this.isSupported) return

    const keys = Object.keys(localStorage).filter((key) => key.startsWith(prefix))
    keys.forEach((key) => this.removeItem(key))
  }

  /**
   * Storage 크기 계산 (바이트)
   */
  public getStorageSize(): number {
    if (!this.isSupported) return 0

    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return total
  }

  /**
   * Storage 크기를 읽기 쉬운 형식으로 반환
   */
  public getReadableSize(): string {
    const bytes = this.getStorageSize()
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  /**
   * 만료된 캐시 정리
   */
  public cleanExpired(): number {
    if (!this.isSupported) return 0

    let cleanedCount = 0
    const keys = Object.keys(localStorage)

    for (const key of keys) {
      try {
        const item = localStorage.getItem(key)
        if (!item) continue

        const data: StorageData<unknown> = JSON.parse(item)
        if (data.expiresAt && Date.now() > data.expiresAt) {
          this.removeItem(key)
          cleanedCount++
        }
      } catch (e) {
        // 파싱 실패한 항목도 제거
        this.removeItem(key)
        cleanedCount++
      }
    }

    console.log(`Cleaned ${cleanedCount} expired items from storage`)
    return cleanedCount
  }

  /**
   * 자동 정리 (24시간마다)
   */
  private autoCleanup(): void {
    const lastCleanup = this.getItem<number>(STORAGE_KEYS.LAST_CLEANUP)
    const now = Date.now()

    if (!lastCleanup || now - lastCleanup > CACHE_DURATION.LONG) {
      this.cleanExpired()
      this.setItem(STORAGE_KEYS.LAST_CLEANUP, now)
    }
  }

  /**
   * Quota 초과 시 처리
   */
  private handleQuotaExceeded(): void {
    console.warn('Storage quota exceeded, attempting to free up space...')

    // 1. 만료된 항목 정리
    this.cleanExpired()

    // 2. 캐시 데이터 정리 (가장 오래된 것부터)
    const cacheKeys = Object.keys(localStorage).filter((key) => key.includes('cache'))
    const cacheItems = cacheKeys
      .map((key) => {
        try {
          const data: StorageData<unknown> = JSON.parse(localStorage.getItem(key) || '{}')
          return { key, timestamp: data.timestamp }
        } catch {
          return { key, timestamp: 0 }
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)

    // 가장 오래된 50% 삭제
    const toDelete = Math.ceil(cacheItems.length * 0.5)
    for (let i = 0; i < toDelete; i++) {
      const item = cacheItems[i]
      if (item) {
        this.removeItem(item.key)
      }
    }

    console.log(`Freed up space by removing ${toDelete} cached items`)
  }

  /**
   * 간단한 암호화 (XOR 기반 - 실제 프로덕션에서는 더 강력한 암호화 사용 권장)
   */
  private encrypt<T>(data: T): string {
    const str = JSON.stringify(data)
    const key = 'movie_app_secret_key_2024' // 실제로는 환경변수로 관리
    let encrypted = ''

    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      encrypted += String.fromCharCode(charCode)
    }

    return btoa(encrypted) // Base64 인코딩
  }

  /**
   * 복호화
   */
  private decrypt(encrypted: unknown): unknown {
    if (typeof encrypted !== 'string') return encrypted

    try {
      const decoded = atob(encrypted)
      const key = 'movie_app_secret_key_2024'
      let decrypted = ''

      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        decrypted += String.fromCharCode(charCode)
      }

      return JSON.parse(decrypted)
    } catch (e) {
      console.error('Decryption failed:', e)
      return null
    }
  }

  /**
   * 데이터 마이그레이션
   */
  private migrate(oldVersion: string | null): void {
    console.log(`Migrating storage from ${oldVersion} to ${CURRENT_STORAGE_VERSION}`)

    // 구버전 데이터 변환 로직
    if (!oldVersion) {
      // 기존 레거시 키들을 새 키로 마이그레이션
      const legacyKeys = {
        users: STORAGE_KEYS.AUTH_USERS,
        currentUser: STORAGE_KEYS.AUTH_CURRENT_USER,
        isLoggedIn: STORAGE_KEYS.AUTH_IS_LOGGED_IN,
        keepLogin: STORAGE_KEYS.AUTH_KEEP_LOGIN,
        movieWishlist: STORAGE_KEYS.USER_WISHLIST,
      }

      Object.entries(legacyKeys).forEach(([oldKey, newKey]) => {
        const data = localStorage.getItem(oldKey)
        if (data) {
          localStorage.setItem(newKey, data)
          localStorage.removeItem(oldKey)
        }
      })
    }
  }

  /**
   * Storage가 지원되는지 확인
   */
  public isStorageSupported(): boolean {
    return this.isSupported
  }

  /**
   * 모든 storage 키 가져오기
   */
  public getAllKeys(): string[] {
    if (!this.isSupported) return []
    return Object.keys(localStorage)
  }

  /**
   * Storage 정보 출력 (디버깅용)
   */
  public getStorageInfo(): {
    isSupported: boolean
    size: string
    itemCount: number
    version: string
  } {
    return {
      isSupported: this.isSupported,
      size: this.getReadableSize(),
      itemCount: this.getAllKeys().length,
      version: CURRENT_STORAGE_VERSION,
    }
  }
}

// 싱글톤 인스턴스 export
export const storage = LocalStorageManager.getInstance()

// 편의를 위한 헬퍼 함수들
export const setLocalStorage = <T>(
  key: string,
  value: T,
  options?: { expiresIn?: number; encrypt?: boolean }
): boolean => storage.setItem(key, value, options)

export const getLocalStorage = <T>(key: string): T | null => storage.getItem<T>(key)

export const removeLocalStorage = (key: string): void => storage.removeItem(key)

export const clearLocalStorage = (): void => storage.clear()

export const getStorageInfo = () => storage.getStorageInfo()
