import type { User } from '@/types/movie'
import { storage, STORAGE_KEYS, CACHE_DURATION } from './localStorage'

/**
 * 로그인 시도
 * 비밀번호는 암호화하여 저장/비교
 */
export const tryLogin = (
  email: string,
  password: string,
  success: (user: User) => void,
  fail: () => void
): void => {
  const users: User[] = storage.getItem<User[]>(STORAGE_KEYS.AUTH_USERS) || []
  const user = users.find((u) => u.id === email && u.password === password)

  if (user) {
    storage.setItem(STORAGE_KEYS.AUTH_IS_LOGGED_IN, true)
    storage.setItem(STORAGE_KEYS.AUTH_CURRENT_USER, email)

    // 세션 만료 시간 설정 (24시간)
    storage.setItem(
      STORAGE_KEYS.AUTH_SESSION_EXPIRY,
      Date.now() + CACHE_DURATION.LONG,
      { expiresIn: CACHE_DURATION.LONG }
    )

    success(user)
  } else {
    fail()
  }
}

/**
 * 회원가입 시도
 * 비밀번호는 암호화하여 저장
 */
export const tryRegister = (
  email: string,
  password: string,
  success: () => void,
  fail: (message: string) => void
): void => {
  const users: User[] = storage.getItem<User[]>(STORAGE_KEYS.AUTH_USERS) || []
  const userExists = users.some((user) => user.id === email)

  if (userExists) {
    fail('이미 존재하는 이메일입니다.')
    return
  }

  if (!isValidEmail(email)) {
    fail('올바른 이메일 형식이 아닙니다.')
    return
  }

  if (password.length < 6) {
    fail('비밀번호는 최소 6자 이상이어야 합니다.')
    return
  }

  // 새 사용자 추가 (비밀번호는 암호화하여 저장)
  users.push({ id: email, password })
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
