import { ref, computed, watch } from 'vue'
import type { Movie } from '@/types/movie'
import { storage, STORAGE_KEYS } from '@/utils/localStorage'
import { getCurrentUser } from '@/utils/auth'

const wishlist = ref<Movie[]>([])

/**
 * 사용자별 위시리스트 키 생성
 */
const getUserWishlistKey = (): string => {
  const user = getCurrentUser()
  return user ? `${STORAGE_KEYS.USER_WISHLIST}_${user}` : STORAGE_KEYS.USER_WISHLIST
}

/**
 * 위시리스트 로드
 */
const loadWishlist = (): void => {
  const key = getUserWishlistKey()
  wishlist.value = storage.getItem<Movie[]>(key) || []
}

/**
 * 위시리스트 저장
 */
const saveWishlist = (): void => {
  const key = getUserWishlistKey()
  storage.setItem(key, wishlist.value)
}

export const useWishlist = () => {
  /**
   * 위시리스트에 영화 추가/제거
   */
  const toggleWishlist = (movie: Movie): void => {
    const index = wishlist.value.findIndex((item) => item.id === movie.id)

    if (index === -1) {
      wishlist.value.push(movie)
    } else {
      wishlist.value.splice(index, 1)
    }

    saveWishlist()
  }

  /**
   * 영화가 위시리스트에 있는지 확인
   */
  const isInWishlist = (movieId: number): boolean => {
    return wishlist.value.some((item) => item.id === movieId)
  }

  /**
   * 전체 위시리스트 가져오기
   */
  const getWishlist = (): Movie[] => {
    return wishlist.value
  }

  /**
   * 위시리스트에서 영화 제거
   */
  const removeFromWishlist = (movieId: number): void => {
    const index = wishlist.value.findIndex((item) => item.id === movieId)
    if (index !== -1) {
      wishlist.value.splice(index, 1)
      saveWishlist()
    }
  }

  /**
   * 위시리스트 전체 삭제
   */
  const clearWishlist = (): void => {
    wishlist.value = []
    saveWishlist()
  }

  /**
   * 위시리스트 개수
   */
  const wishlistCount = computed(() => wishlist.value.length)

  // 초기 로드
  if (wishlist.value.length === 0) {
    loadWishlist()
  }

  // 사용자 변경 시 위시리스트 다시 로드
  watch(() => getCurrentUser(), () => {
    loadWishlist()
  })

  return {
    wishlist,
    toggleWishlist,
    isInWishlist,
    getWishlist,
    removeFromWishlist,
    clearWishlist,
    wishlistCount,
  }
}
