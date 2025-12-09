import { ref } from 'vue'
import type { Movie } from '@/types/movie'
import { getMovieRecommendations, getSimilarMovies } from '@/utils/tmdb'

export function useRecommendations() {
  const recommendations = ref<Movie[]>([])
  const loading = ref(false)

  const getRecommendationsFromWishlist = async (wishlistMovies: Movie[]) => {
    if (wishlistMovies.length === 0) {
      recommendations.value = []
      return
    }

    loading.value = true

    try {
      const allRecommendations: Movie[] = []
      const seenIds = new Set<number>()

      // 찜한 영화들의 ID 저장 (중복 방지)
      wishlistMovies.forEach((movie) => seenIds.add(movie.id))

      // 찜한 영화들 중 최대 5개만 사용 (API 호출 최소화)
      const samplesToUse = wishlistMovies.slice(0, Math.min(5, wishlistMovies.length))

      // 각 영화의 추천 영화 가져오기
      const promises = samplesToUse.map(async (movie) => {
        try {
          const [recommendations, similar] = await Promise.all([
            getMovieRecommendations(movie.id, 1),
            getSimilarMovies(movie.id, 1)
          ])

          return [...recommendations.results, ...similar.results]
        } catch (error) {
          console.error(`영화 ${movie.id}의 추천 가져오기 실패:`, error)
          return []
        }
      })

      const results = await Promise.all(promises)

      // 결과 병합 및 중복 제거
      results.flat().forEach((movie) => {
        if (!seenIds.has(movie.id) && movie.poster_path) {
          seenIds.add(movie.id)
          allRecommendations.push(movie)
        }
      })

      // 랜덤 셔플
      const shuffled = allRecommendations.sort(() => Math.random() - 0.5)

      // 최대 20개만 표시
      recommendations.value = shuffled.slice(0, 20)
    } catch (error) {
      console.error('추천 영화 로드 실패:', error)
      recommendations.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    recommendations,
    loading,
    getRecommendationsFromWishlist
  }
}
