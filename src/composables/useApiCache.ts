import { storage, STORAGE_KEYS, CACHE_DURATION } from '@/utils/localStorage'
import type { Movie } from '@/types/movie'

/**
 * 캐시된 데이터 인터페이스
 */
interface CachedData<T> {
  data: T
  cachedAt: number
}

/**
 * 장르 타입
 */
export interface Genre {
  id: number
  name: string
}

/**
 * 영화 상세 정보 캐시 키 생성
 */
const getMovieDetailCacheKey = (movieId: number): string => {
  return `${STORAGE_KEYS.CACHE_MOVIE_DETAILS}_${movieId}`
}

/**
 * API 캐싱 Composable
 */
export const useApiCache = () => {
  /**
   * 인기 영화 캐시 저장
   */
  const cachePopularMovies = (movies: Movie[], duration = CACHE_DURATION.MEDIUM): void => {
    storage.setItem(STORAGE_KEYS.CACHE_POPULAR, movies, { expiresIn: duration })
  }

  /**
   * 인기 영화 캐시 가져오기
   */
  const getCachedPopularMovies = (): Movie[] | null => {
    return storage.getItem<Movie[]>(STORAGE_KEYS.CACHE_POPULAR)
  }

  /**
   * 트렌딩 영화 캐시 저장
   */
  const cacheTrendingMovies = (movies: Movie[], duration = CACHE_DURATION.SHORT): void => {
    storage.setItem(STORAGE_KEYS.CACHE_TRENDING, movies, { expiresIn: duration })
  }

  /**
   * 트렌딩 영화 캐시 가져오기
   */
  const getCachedTrendingMovies = (): Movie[] | null => {
    return storage.getItem<Movie[]>(STORAGE_KEYS.CACHE_TRENDING)
  }

  /**
   * 장르 목록 캐시 저장 (장기간 캐시)
   */
  const cacheGenres = (genres: Genre[]): void => {
    storage.setItem(STORAGE_KEYS.CACHE_GENRES, genres, { expiresIn: CACHE_DURATION.WEEK })
  }

  /**
   * 장르 목록 캐시 가져오기
   */
  const getCachedGenres = (): Genre[] | null => {
    return storage.getItem<Genre[]>(STORAGE_KEYS.CACHE_GENRES)
  }

  /**
   * 영화 상세 정보 캐시 저장
   */
  const cacheMovieDetails = (movieId: number, movie: Movie): void => {
    const key = getMovieDetailCacheKey(movieId)
    storage.setItem(key, movie, { expiresIn: CACHE_DURATION.LONG })
  }

  /**
   * 영화 상세 정보 캐시 가져오기
   */
  const getCachedMovieDetails = (movieId: number): Movie | null => {
    const key = getMovieDetailCacheKey(movieId)
    return storage.getItem<Movie>(key)
  }

  /**
   * 검색 결과 캐시 저장
   */
  const cacheSearchResults = (query: string, movies: Movie[]): void => {
    const key = `${STORAGE_KEYS.CACHE_MOVIES}_search_${query}`
    storage.setItem(key, movies, { expiresIn: CACHE_DURATION.MEDIUM })
  }

  /**
   * 검색 결과 캐시 가져오기
   */
  const getCachedSearchResults = (query: string): Movie[] | null => {
    const key = `${STORAGE_KEYS.CACHE_MOVIES}_search_${query}`
    return storage.getItem<Movie[]>(key)
  }

  /**
   * 특정 카테고리 영화 캐시 저장
   */
  const cacheCategoryMovies = (category: string, movies: Movie[], duration = CACHE_DURATION.MEDIUM): void => {
    const key = `${STORAGE_KEYS.CACHE_MOVIES}_${category}`
    storage.setItem(key, movies, { expiresIn: duration })
  }

  /**
   * 특정 카테고리 영화 캐시 가져오기
   */
  const getCachedCategoryMovies = (category: string): Movie[] | null => {
    const key = `${STORAGE_KEYS.CACHE_MOVIES}_${category}`
    return storage.getItem<Movie[]>(key)
  }

  /**
   * 영화 이미지 URL 캐시 저장 (임시)
   */
  const cacheMovieImages = (movieId: number, images: { [key: string]: string }): void => {
    const key = `movie_images_${movieId}`
    storage.setItem(key, images, { expiresIn: CACHE_DURATION.WEEK })
  }

  /**
   * 영화 이미지 URL 캐시 가져오기
   */
  const getCachedMovieImages = (movieId: number): { [key: string]: string } | null => {
    const key = `movie_images_${movieId}`
    return storage.getItem<{ [key: string]: string }>(key)
  }

  /**
   * 특정 영화 캐시 삭제
   */
  const clearMovieCache = (movieId: number): void => {
    const key = getMovieDetailCacheKey(movieId)
    storage.removeItem(key)
  }

  /**
   * 모든 영화 캐시 삭제
   */
  const clearAllMovieCache = (): void => {
    storage.clearByPrefix('movie_app_cache')
  }

  /**
   * 캐시 통계 정보
   */
  const getCacheStats = (): {
    size: string
    itemCount: number
    cacheKeys: string[]
  } => {
    const allKeys = storage.getAllKeys()
    const cacheKeys = allKeys.filter((key) => key.includes('cache'))

    return {
      size: storage.getReadableSize(),
      itemCount: cacheKeys.length,
      cacheKeys,
    }
  }

  /**
   * 캐시 유효성 확인
   */
  const isCacheValid = (key: string): boolean => {
    return storage.getItem(key) !== null
  }

  /**
   * 조건부 API 호출 (캐시가 있으면 캐시 사용, 없으면 API 호출)
   */
  const fetchWithCache = async <T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    duration = CACHE_DURATION.MEDIUM
  ): Promise<T> => {
    const cached = storage.getItem<T>(cacheKey)

    if (cached) {
      console.log(`Cache hit: ${cacheKey}`)
      return cached
    }

    console.log(`Cache miss: ${cacheKey}, fetching from API...`)
    const data = await fetchFn()
    storage.setItem(cacheKey, data, { expiresIn: duration })
    return data
  }

  return {
    // 인기 영화
    cachePopularMovies,
    getCachedPopularMovies,

    // 트렌딩 영화
    cacheTrendingMovies,
    getCachedTrendingMovies,

    // 장르
    cacheGenres,
    getCachedGenres,

    // 영화 상세
    cacheMovieDetails,
    getCachedMovieDetails,

    // 검색 결과
    cacheSearchResults,
    getCachedSearchResults,

    // 카테고리별 영화
    cacheCategoryMovies,
    getCachedCategoryMovies,

    // 이미지
    cacheMovieImages,
    getCachedMovieImages,

    // 캐시 관리
    clearMovieCache,
    clearAllMovieCache,
    getCacheStats,
    isCacheValid,

    // 고급 기능
    fetchWithCache,
  }
}
