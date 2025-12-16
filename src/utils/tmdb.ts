import axios from 'axios'
import type { MovieResponse, Genre } from '@/types/movie'
import { storage, STORAGE_KEYS } from './localStorage'

const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

/**
 * 사용자의 API 키 가져오기
 * 로그인한 사용자의 API 키를 우선 사용하고, 없으면 환경변수의 API 키 사용
 */
const getUserApiKey = (): string => {
  const userApiKey = storage.getItem<string>(STORAGE_KEYS.AUTH_TOKEN)
  return userApiKey || API_KEY
}

const createUrl = (
  endpoint: string,
  params: Record<string, string | number> = {},
  apiKey?: string
): string => {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.append('api_key', apiKey || getUserApiKey())
  url.searchParams.append('language', 'ko-KR')

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })

  return url.toString()
}

/**
 * TMDB API 키 유효성 검증
 * 실제 API 호출을 통해 API 키가 유효한지 확인
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const url = createUrl('/configuration', {}, apiKey)
    await axios.get(url)
    return true
  } catch (error: any) {
    // 401 에러 = 유효하지 않은 API 키
    if (error.response && error.response.status === 401) {
      return false
    }
    // 기타 네트워크 에러 등
    console.error('API 키 검증 실패:', error)
    return false
  }
}

const fetchData = async <T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> => {
  try {
    const url = createUrl(endpoint, params)
    const response = await axios.get<T>(url)
    return response.data
  } catch (error) {
    console.error(`API 요청 실패: ${endpoint}`, error)
    throw error
  }
}

export const fetchMovies = (
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<MovieResponse> => {
  return fetchData<MovieResponse>(endpoint, params)
}

export const getPopularMovies = (page: number = 1): Promise<MovieResponse> => {
  return fetchMovies('/movie/popular', { page })
}

export const getNowPlayingMovies = (page: number = 1): Promise<MovieResponse> => {
  return fetchMovies('/movie/now_playing', { page })
}

export const getTopRatedMovies = (page: number = 1): Promise<MovieResponse> => {
  return fetchMovies('/movie/top_rated', { page })
}

export const getUpcomingMovies = (page: number = 1): Promise<MovieResponse> => {
  return fetchMovies('/movie/upcoming', { page })
}

export const getTrendingMovies = (
  timeWindow: 'day' | 'week' = 'day',
  page: number = 1
): Promise<MovieResponse> => {
  return fetchMovies(`/trending/movie/${timeWindow}`, { page })
}

export const getPopularTvShows = (page: number = 1): Promise<any> => {
  return fetchData<any>('/tv/popular', { page })
}

export const getPopularKoreanMovies = (page: number = 1): Promise<MovieResponse> => {
  return fetchMovies('/movie/popular', { page, region: 'KR' })
}

export const getPopularKoreanTvShows = (page: number = 1): Promise<any> => {
  return fetchData<any>('/tv/popular', { page, region: 'KR' })
}

export const searchMovies = (query: string, page: number = 1): Promise<MovieResponse> => {
  return fetchMovies('/search/movie', { query, page })
}

export const discoverMovies = (
  params: Record<string, string | number> = {}
): Promise<MovieResponse> => {
  return fetchMovies('/discover/movie', params)
}

export const discoverTvShows = (
  params: Record<string, string | number> = {}
): Promise<any> => {
  return fetchData<any>('/discover/tv', params)
}

export const getGenres = async (): Promise<Genre[]> => {
  try {
    const url = createUrl('/genre/movie/list')
    const response = await axios.get<{ genres: Genre[] }>(url)
    return response.data.genres
  } catch (error) {
    console.error('장르 목록 요청 실패:', error)
    throw error
  }
}

export const getPosterUrl = (posterPath: string | null, size: string = 'w500'): string => {
  if (!posterPath) return '/placeholder-movie.png'
  return `${IMAGE_BASE_URL}/${size}${posterPath}`
}

export const getBackdropUrl = (backdropPath: string | null, size: string = 'w1280'): string => {
  if (!backdropPath) return '/placeholder-backdrop.png'
  return `${IMAGE_BASE_URL}/${size}${backdropPath}`
}

export const getMovieDetails = async (movieId: number): Promise<any> => {
  try {
    const url = createUrl(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,keywords'
    })
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error('영화 상세 정보 요청 실패:', error)
    throw error
  }
}

export const getMovieRecommendations = (
  movieId: number,
  page: number = 1
): Promise<MovieResponse> => {
  return fetchMovies(`/movie/${movieId}/recommendations`, { page })
}

export const getSimilarMovies = (movieId: number, page: number = 1): Promise<MovieResponse> => {
  return fetchMovies(`/movie/${movieId}/similar`, { page })
}

export const getWatchProviders = async (movieId: number): Promise<any> => {
  try {
    const url = createUrl(`/movie/${movieId}/watch/providers`)
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error('시청 플랫폼 정보 요청 실패:', error)
    throw error
  }
}

export const getAvailableWatchProviders = async (): Promise<any> => {
  try {
    const url = createUrl('/watch/providers/movie', { watch_region: 'KR' })
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error('사용 가능한 플랫폼 목록 요청 실패:', error)
    throw error
  }
}