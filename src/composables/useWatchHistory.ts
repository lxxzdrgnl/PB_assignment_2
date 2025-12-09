import { ref, computed } from 'vue'
import { storage, STORAGE_KEYS } from '@/utils/localStorage'
import { getCurrentUser } from '@/utils/auth'
import type { Movie } from '@/types/movie'

/**
 * 시청 기록 아이템
 */
export interface WatchHistoryItem {
  movie: Movie
  watchedAt: number
  watchProgress?: number // 0-100 퍼센트
  watchDuration?: number // 시청 시간 (초)
  completed: boolean
  lastPosition?: number // 마지막 재생 위치 (초)
}

const MAX_HISTORY_ITEMS = 100
const watchHistory = ref<WatchHistoryItem[]>([])

/**
 * 사용자별 시청 기록 키 생성
 */
const getUserWatchHistoryKey = (): string => {
  const user = getCurrentUser()
  return user ? `${STORAGE_KEYS.USER_WATCH_HISTORY}_${user}` : STORAGE_KEYS.USER_WATCH_HISTORY
}

/**
 * 시청 기록 로드
 */
const loadWatchHistory = (): void => {
  const key = getUserWatchHistoryKey()
  watchHistory.value = storage.getItem<WatchHistoryItem[]>(key) || []
}

/**
 * 시청 기록 저장
 */
const saveWatchHistory = (): void => {
  const key = getUserWatchHistoryKey()
  storage.setItem(key, watchHistory.value)
}

export const useWatchHistory = () => {
  /**
   * 영화 시청 기록 추가/업데이트
   */
  const addToWatchHistory = (
    movie: Movie,
    options?: {
      watchProgress?: number
      watchDuration?: number
      completed?: boolean
      lastPosition?: number
    }
  ): void => {
    // 기존 기록 찾기
    const existingIndex = watchHistory.value.findIndex((item) => item.movie.id === movie.id)

    const historyItem: WatchHistoryItem = {
      movie,
      watchedAt: Date.now(),
      watchProgress: options?.watchProgress,
      watchDuration: options?.watchDuration,
      completed: options?.completed || false,
      lastPosition: options?.lastPosition,
    }

    if (existingIndex !== -1) {
      // 기존 기록 업데이트 (최신 정보로)
      watchHistory.value[existingIndex] = historyItem
    } else {
      // 새 기록 추가 (맨 앞에)
      watchHistory.value.unshift(historyItem)
    }

    // 최대 개수 제한
    if (watchHistory.value.length > MAX_HISTORY_ITEMS) {
      watchHistory.value = watchHistory.value.slice(0, MAX_HISTORY_ITEMS)
    }

    saveWatchHistory()
  }

  /**
   * 영화가 시청 기록에 있는지 확인
   */
  const isInWatchHistory = (movieId: number): boolean => {
    return watchHistory.value.some((item) => item.movie.id === movieId)
  }

  /**
   * 특정 영화의 시청 기록 가져오기
   */
  const getMovieWatchHistory = (movieId: number): WatchHistoryItem | null => {
    return watchHistory.value.find((item) => item.movie.id === movieId) || null
  }

  /**
   * 시청 완료한 영화 목록
   */
  const getCompletedMovies = (): WatchHistoryItem[] => {
    return watchHistory.value.filter((item) => item.completed)
  }

  /**
   * 시청 중인 영화 목록 (완료하지 않은)
   */
  const getInProgressMovies = (): WatchHistoryItem[] => {
    return watchHistory.value.filter((item) => !item.completed && item.watchProgress)
  }

  /**
   * 최근 시청한 영화 가져오기
   */
  const getRecentWatchedMovies = (limit: number = 10): WatchHistoryItem[] => {
    return watchHistory.value
      .sort((a, b) => b.watchedAt - a.watchedAt)
      .slice(0, limit)
  }

  /**
   * 특정 영화 시청 기록 삭제
   */
  const removeFromWatchHistory = (movieId: number): void => {
    watchHistory.value = watchHistory.value.filter((item) => item.movie.id !== movieId)
    saveWatchHistory()
  }

  /**
   * 시청 기록 전체 삭제
   */
  const clearWatchHistory = (): void => {
    watchHistory.value = []
    saveWatchHistory()
  }

  /**
   * 특정 기간의 시청 기록 가져오기
   */
  const getWatchHistoryByDateRange = (startDate: Date, endDate: Date): WatchHistoryItem[] => {
    const start = startDate.getTime()
    const end = endDate.getTime()

    return watchHistory.value.filter(
      (item) => item.watchedAt >= start && item.watchedAt <= end
    )
  }

  /**
   * 시청 시간 통계
   */
  const getWatchStats = (): {
    totalMovies: number
    completedMovies: number
    inProgressMovies: number
    totalWatchTime: number // 분 단위
    averageWatchTime: number
  } => {
    const totalMovies = watchHistory.value.length
    const completedMovies = getCompletedMovies().length
    const inProgressMovies = getInProgressMovies().length

    const totalWatchTime = watchHistory.value.reduce((sum, item) => {
      return sum + (item.watchDuration || 0)
    }, 0)

    const averageWatchTime = totalMovies > 0 ? totalWatchTime / totalMovies : 0

    return {
      totalMovies,
      completedMovies,
      inProgressMovies,
      totalWatchTime: Math.round(totalWatchTime / 60), // 초를 분으로 변환
      averageWatchTime: Math.round(averageWatchTime / 60),
    }
  }

  /**
   * 영화 재생 위치 업데이트
   */
  const updateWatchPosition = (movieId: number, position: number, progress: number): void => {
    const item = watchHistory.value.find((item) => item.movie.id === movieId)

    if (item) {
      item.lastPosition = position
      item.watchProgress = progress
      item.watchedAt = Date.now()

      // 90% 이상 시청하면 완료로 표시
      if (progress >= 90) {
        item.completed = true
      }

      saveWatchHistory()
    }
  }

  /**
   * 시청 기록 개수
   */
  const historyCount = computed(() => watchHistory.value.length)

  /**
   * 완료한 영화 개수
   */
  const completedCount = computed(() => getCompletedMovies().length)

  /**
   * 시청 중인 영화 개수
   */
  const inProgressCount = computed(() => getInProgressMovies().length)

  // 초기 로드
  if (watchHistory.value.length === 0) {
    loadWatchHistory()
  }

  return {
    watchHistory,
    addToWatchHistory,
    isInWatchHistory,
    getMovieWatchHistory,
    getCompletedMovies,
    getInProgressMovies,
    getRecentWatchedMovies,
    removeFromWatchHistory,
    clearWatchHistory,
    getWatchHistoryByDateRange,
    getWatchStats,
    updateWatchPosition,
    historyCount,
    completedCount,
    inProgressCount,
  }
}
