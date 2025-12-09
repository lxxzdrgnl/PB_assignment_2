import { ref, computed } from 'vue'
import { storage, STORAGE_KEYS } from '@/utils/localStorage'
import { getCurrentUser } from '@/utils/auth'

/**
 * 검색 히스토리 아이템
 */
export interface SearchHistoryItem {
  query: string
  timestamp: number
}

const MAX_HISTORY_ITEMS = 20
const searchHistory = ref<SearchHistoryItem[]>([])

/**
 * 사용자별 검색 히스토리 키 생성
 */
const getUserSearchHistoryKey = (): string => {
  const user = getCurrentUser()
  return user ? `${STORAGE_KEYS.USER_SEARCH_HISTORY}_${user}` : STORAGE_KEYS.USER_SEARCH_HISTORY
}

/**
 * 검색 히스토리 로드
 */
const loadSearchHistory = (): void => {
  const key = getUserSearchHistoryKey()
  searchHistory.value = storage.getItem<SearchHistoryItem[]>(key) || []
}

/**
 * 검색 히스토리 저장
 */
const saveSearchHistory = (): void => {
  const key = getUserSearchHistoryKey()
  storage.setItem(key, searchHistory.value)
}

export const useSearchHistory = () => {
  /**
   * 검색어 추가
   */
  const addSearchQuery = (query: string): void => {
    if (!query || query.trim() === '') return

    const trimmedQuery = query.trim()

    // 중복 검색어 제거
    searchHistory.value = searchHistory.value.filter((item) => item.query !== trimmedQuery)

    // 새 검색어를 맨 앞에 추가
    searchHistory.value.unshift({
      query: trimmedQuery,
      timestamp: Date.now(),
    })

    // 최대 개수 제한
    if (searchHistory.value.length > MAX_HISTORY_ITEMS) {
      searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY_ITEMS)
    }

    saveSearchHistory()
  }

  /**
   * 검색어 삭제
   */
  const removeSearchQuery = (query: string): void => {
    searchHistory.value = searchHistory.value.filter((item) => item.query !== query)
    saveSearchHistory()
  }

  /**
   * 검색 히스토리 전체 삭제
   */
  const clearSearchHistory = (): void => {
    searchHistory.value = []
    saveSearchHistory()
  }

  /**
   * 검색 히스토리 가져오기
   */
  const getSearchHistory = (): SearchHistoryItem[] => {
    return searchHistory.value
  }

  /**
   * 최근 검색어 가져오기 (제한된 개수)
   */
  const getRecentSearches = (limit: number = 10): SearchHistoryItem[] => {
    return searchHistory.value.slice(0, limit)
  }

  /**
   * 인기 검색어 가져오기 (빈도수 기반)
   */
  const getPopularSearches = (limit: number = 5): string[] => {
    const queryCount = new Map<string, number>()

    searchHistory.value.forEach((item) => {
      queryCount.set(item.query, (queryCount.get(item.query) || 0) + 1)
    })

    return Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query)
  }

  /**
   * 검색 히스토리 개수
   */
  const historyCount = computed(() => searchHistory.value.length)

  // 초기 로드
  if (searchHistory.value.length === 0) {
    loadSearchHistory()
  }

  return {
    searchHistory,
    addSearchQuery,
    removeSearchQuery,
    clearSearchHistory,
    getSearchHistory,
    getRecentSearches,
    getPopularSearches,
    historyCount,
  }
}
