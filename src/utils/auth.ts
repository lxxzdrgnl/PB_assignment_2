import type { User } from '@/types/movie'
import { storage, STORAGE_KEYS, CACHE_DURATION } from './localStorage'
import { validateApiKey } from './tmdb'

/**
 * 로그인 시도
 * 비밀번호(TMDB API 키)의 유효성을 실제 API 호출로 검증
 */
export const tryLogin = async (
  email: string,
  apiKey: string,
  success: (user: User) => void,
  fail: (message: string) => void
): Promise<void> => {
  const users: User[] = storage.getItem<User[]>(STORAGE_KEYS.AUTH_USERS) || []
  const user = users.find((u) => u.id === email && u.password === apiKey)

  if (!user) {
    fail('이메일 또는 API 키가 일치하지 않습니다.')
    return
  }

  // TMDB API 키 유효성 검증
  const isValidKey = await validateApiKey(apiKey)
  if (!isValidKey) {
    fail('유효하지 않은 TMDB API 키입니다.')
    return
  }

  // 로그인 성공
  storage.setItem(STORAGE_KEYS.AUTH_IS_LOGGED_IN, true)
  storage.setItem(STORAGE_KEYS.AUTH_CURRENT_USER, email)
  storage.setItem(STORAGE_KEYS.AUTH_TOKEN, apiKey) // 사용자의 API 키 저장

  // 세션 만료 시간 설정 (24시간)
  storage.setItem(
    STORAGE_KEYS.AUTH_SESSION_EXPIRY,
    Date.now() + CACHE_DURATION.LONG,
    { expiresIn: CACHE_DURATION.LONG }
  )

  success(user)
}

/**
 * 회원가입 시도
 * TMDB API 키의 유효성을 실제 API 호출로 검증
 */
export const tryRegister = async (
  email: string,
  apiKey: string,
  success: () => void,
  fail: (message: string) => void
): Promise<void> => {
  const users: User[] = storage.getItem<User[]>(STORAGE_KEYS.AUTH_USERS) || []

  // 아이디(이메일) 중복 확인
  const userExists = users.some((user) => user.id === email)
  if (userExists) {
    fail('이미 존재하는 이메일입니다.')
    return
  }

  // 이메일 형식 검증
  if (!isValidEmail(email)) {
    fail('올바른 이메일 형식이 아닙니다.')
    return
  }

  // API 키 길이 검증 (TMDB API 키는 32자)
  if (apiKey.length < 20) {
    fail('TMDB API 키는 최소 20자 이상이어야 합니다.')
    return
  }

  // TMDB API 키 유효성 검증
  const isValidKey = await validateApiKey(apiKey)
  if (!isValidKey) {
    fail('유효하지 않은 TMDB API 키입니다. API 키를 확인해주세요.')
    return
  }

  // 새 사용자 추가 (API 키는 암호화하여 저장)
  users.push({ id: email, password: apiKey })
  storage.setItem(STORAGE_KEYS.AUTH_USERS, users, { encrypt: true })

  success()
}

/**
 * 로그아웃
 */
export const logout = (): void => {
  storage.removeItem(STORAGE_KEYS.AUTH_IS_LOGGED_IN)
  storage.removeItem(STORAGE_KEYS.AUTH_CURRENT_USER)
  storage.removeItem(STORAGE_KEYS.AUTH_KEEP_LOGIN)
  storage.removeItem(STORAGE_KEYS.AUTH_SESSION_EXPIRY)
  storage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
}

/**
 * 로그인 여부 확인 (세션 만료 체크 포함)
 */
export const isLoggedIn = (): boolean => {
  const isLoggedIn = storage.getItem<boolean>(STORAGE_KEYS.AUTH_IS_LOGGED_IN)
  const sessionExpiry = storage.getItem<number>(STORAGE_KEYS.AUTH_SESSION_EXPIRY)
  const keepLogin = shouldKeepLogin()

  // Keep Login이 활성화되어 있으면 세션 만료 무시
  if (keepLogin) {
    return !!isLoggedIn
  }

  // 세션 만료 체크
  if (sessionExpiry && Date.now() > sessionExpiry) {
    logout()
    return false
  }

  return !!isLoggedIn
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export const getCurrentUser = (): string | null => {
  if (!isLoggedIn()) return null
  return storage.getItem<string>(STORAGE_KEYS.AUTH_CURRENT_USER)
}

/**
 * 이메일 유효성 검사
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 로그인 유지 설정
 */
export const setKeepLogin = (keep: boolean): void => {
  if (keep) {
    storage.setItem(STORAGE_KEYS.AUTH_KEEP_LOGIN, true)
  } else {
    storage.removeItem(STORAGE_KEYS.AUTH_KEEP_LOGIN)
  }
}

/**
 * 로그인 유지 여부 확인
 */
export const shouldKeepLogin = (): boolean => {
  return !!storage.getItem<boolean>(STORAGE_KEYS.AUTH_KEEP_LOGIN)
}
