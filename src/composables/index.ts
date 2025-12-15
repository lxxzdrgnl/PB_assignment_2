/**
 * Composables Index
 * 모든 composable 함수를 한 곳에서 export
 */

// 위시리스트 관리
export { useWishlist } from './useWishlist'

// 검색 히스토리 관리
export { useSearchHistory } from './useSearchHistory'
export type { SearchHistoryItem } from './useSearchHistory'

// 사용자 설정 관리
export { useUserPreferences } from './useUserPreferences'
export type { Theme, Language, SortOption, UserPreferences } from './useUserPreferences'

// API 캐싱
export { useApiCache } from './useApiCache'
export type { Genre } from './useApiCache'

// 시청 기록 관리
export { useWatchHistory } from './useWatchHistory'
export type { WatchHistoryItem } from './useWatchHistory'

// 영화 추천
export { useRecommendations } from './useRecommendations'

// 테마 관리
export { useTheme } from './useTheme'
export type { Theme as ThemeMode } from './useTheme'
