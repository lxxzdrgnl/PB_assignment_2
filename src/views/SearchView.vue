<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import LargeMovieCard from '@/components/LargeMovieCard.vue'
import MovieCardSkeleton from '@/components/MovieCardSkeleton.vue'
import MovieDetailModal from '@/components/MovieDetailModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { Movie, Genre } from '@/types/movie'
import { discoverMovies, getGenres, searchMovies as searchMoviesAPI, getAvailableWatchProviders, getMovieRecommendations, getSimilarMovies } from '@/utils/tmdb'
import { useSearchHistory } from '@/composables/useSearchHistory'
import { useWishlist } from '@/composables/useWishlist'

const movies = ref<Movie[]>([])
const genres = ref<Genre[]>([])
const watchProviders = ref<any[]>([])
const loading = ref(false)
const selectedGenre = ref<string>('')
const selectedRating = ref<string>('')
const selectedProvider = ref<string>('')
const sortBy = ref<string>('recommended')
const selectedMovie = ref<Movie | null>(null)
const showModal = ref(false)
const searchQuery = ref<string>('')
const currentPage = ref(1)
const hasMorePages = ref(true)
const isLoadingMore = ref(false)
const showScrollTop = ref(false)
const showSearchHistory = ref(false)
let searchTimeout: number | null = null

// 검색 히스토리 관리
const { addSearchQuery, removeSearchQuery, clearSearchHistory, getRecentSearches } =
  useSearchHistory()

// 찜 목록 관리
const { wishlist } = useWishlist()

// 추천 영화 목록 (전체 객체)
const recommendedMovies = ref<Movie[]>([])

// 최근 검색어 가져오기 (최대 10개)
const recentSearches = computed(() => getRecentSearches(10))

// 찜한 영화 기반으로 추천 영화 로드
const loadRecommendedMovies = async () => {
  console.log('=== 추천 영화 로드 시작 ===')
  console.log('찜한 영화 개수:', wishlist.value.length)

  if (wishlist.value.length === 0) {
    console.log('찜한 영화가 없습니다. 추천 영화를 비웁니다.')
    recommendedMovies.value = []
    return
  }

  try {
    const allRecommendations: Movie[] = []
    const seenIds = new Set<number>()

    // 찜한 영화들의 ID 저장 (중복 방지)
    wishlist.value.forEach((movie) => seenIds.add(movie.id))

    // 찜한 영화들 중 최대 5개만 사용 (API 호출 최소화)
    const samplesToUse = wishlist.value.slice(0, Math.min(5, wishlist.value.length))
    console.log('사용할 찜한 영화:', samplesToUse.map(m => m.title))

    // 각 영화의 추천 영화 가져오기
    const promises = samplesToUse.map(async (movie) => {
      try {
        const [recommendations, similar] = await Promise.all([
          getMovieRecommendations(movie.id, 1),
          getSimilarMovies(movie.id, 1)
        ])

        console.log(`"${movie.title}"의 추천 영화 ${recommendations.results.length}개, 유사 영화 ${similar.results.length}개`)
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

    recommendedMovies.value = shuffled
    console.log('총 추천 영화 개수:', recommendedMovies.value.length)
    console.log('추천 영화 샘플:', recommendedMovies.value.slice(0, 5).map(m => m.title))
  } catch (error) {
    console.error('추천 영화 로드 실패:', error)
    recommendedMovies.value = []
  }
}

const loadGenres = async () => {
  try {
    genres.value = await getGenres()
  } catch (err) {
    console.error('장르 목록 로드 실패:', err)
  }
}

const loadWatchProviders = async () => {
  try {
    const response = await getAvailableWatchProviders()
    // 한국에서 주요 플랫폼만 필터링
    const majorProviders = [8, 337, 350, 356, 97, 119, 1899] // Netflix, Disney+, Apple TV+, Watcha, Google Play, Amazon, TVING
    watchProviders.value = response.results
      .filter((p: any) => majorProviders.includes(p.provider_id))
      .sort((a: any, b: any) => a.display_priority - b.display_priority)
  } catch (err) {
    console.error('시청 플랫폼 목록 로드 실패:', err)
  }
}

const searchMovies = async (append: boolean = false) => {
  try {
    if (!append) {
      loading.value = true
      currentPage.value = 1
    } else {
      isLoadingMore.value = true
    }

    const page = append ? currentPage.value + 1 : 1

    // 검색어가 있으면 검색 API 사용
    if (searchQuery.value.trim()) {
      // 검색 히스토리에 추가 (첫 페이지 검색일 때만)
      if (!append) {
        addSearchQuery(searchQuery.value.trim())
        showSearchHistory.value = false
      }

      const response = await searchMoviesAPI(searchQuery.value.trim(), page)

      let newMovies = response.results

      // 필터 적용
      if (selectedGenre.value) {
        newMovies = newMovies.filter((movie) =>
          movie.genre_ids?.includes(Number(selectedGenre.value))
        )
      }

      if (selectedRating.value) {
        newMovies = newMovies.filter(
          (movie) => movie.vote_average >= Number(selectedRating.value)
        )
      }

      // 정렬 적용
      if (sortBy.value === 'recommended') {
        console.log('=== 추천순 정렬 적용 (검색) ===')
        console.log('찜한 영화 개수:', wishlist.value.length)
        console.log('추천 영화 개수:', recommendedMovies.value.length)
        console.log('검색 결과 개수:', newMovies.length)

        // 찜한 영화가 없으면 인기순으로 표시
        if (wishlist.value.length === 0 || recommendedMovies.value.length === 0) {
          console.log('찜한 영화가 없습니다. 인기순으로 표시합니다.')
          newMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        } else {
          // 추천 영화 중 검색어와 매칭되는 것 필터링
          const filteredRecommendations = recommendedMovies.value.filter((movie) => {
            const matchesSearch = movie.title.toLowerCase().includes(searchQuery.value.toLowerCase())
            const matchesGenre = !selectedGenre.value || movie.genre_ids?.includes(Number(selectedGenre.value))
            const matchesRating = !selectedRating.value || movie.vote_average >= Number(selectedRating.value)
            return matchesSearch && matchesGenre && matchesRating
          })

          console.log('필터링된 추천 영화 개수:', filteredRecommendations.length)

          // 추천 영화 ID 세트
          const recommendedIds = new Set(filteredRecommendations.map(m => m.id))

          // 검색 결과에서 추천 영화 제외 (중복 방지)
          const otherMovies = newMovies.filter(m => !recommendedIds.has(m.id))

          // 추천 영화를 상단에, 나머지를 하단에 배치
          newMovies = [...filteredRecommendations, ...otherMovies]

          console.log('최종 결과 - 추천:', filteredRecommendations.length, '일반:', otherMovies.length)
        }
      } else if (sortBy.value === 'popularity.desc') {
        newMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      } else if (sortBy.value === 'popularity.asc') {
        newMovies.sort((a, b) => (a.popularity || 0) - (b.popularity || 0))
      } else if (sortBy.value === 'vote_average.desc') {
        newMovies.sort((a, b) => b.vote_average - a.vote_average)
      } else if (sortBy.value === 'vote_average.asc') {
        newMovies.sort((a, b) => a.vote_average - b.vote_average)
      } else if (sortBy.value === 'release_date.desc') {
        newMovies.sort((a, b) => b.release_date.localeCompare(a.release_date))
      } else if (sortBy.value === 'release_date.asc') {
        newMovies.sort((a, b) => a.release_date.localeCompare(b.release_date))
      } else if (sortBy.value === 'title.asc') {
        newMovies.sort((a, b) => a.title.localeCompare(b.title))
      }

      if (append) {
        movies.value = [...movies.value, ...newMovies]
      } else {
        movies.value = newMovies
      }

      hasMorePages.value = page < response.total_pages
      if (append) currentPage.value = page
    } else {
      // 검색어가 없으면 기존 discover API 사용
      const params: Record<string, string | number> = {
        page: page,
      }
      // sort_by가 'recommended'가 아닌 경우에만 API에 정렬 파라미터 전송
      if (sortBy.value !== 'recommended') {
        params.sort_by = sortBy.value
      } else {
        // 'recommended'일 경우, 인기순으로 가져옴
        params.sort_by = 'popularity.desc'
      }

      if (selectedGenre.value) {
        params.with_genres = selectedGenre.value
      }

      if (selectedRating.value) {
        params['vote_average.gte'] = selectedRating.value
      }

      if (selectedProvider.value) {
        params.with_watch_providers = selectedProvider.value
        params.watch_region = 'KR'
      }

      const response = await discoverMovies(params)
      let resultsToDisplay = response.results

      // 추천순 정렬 적용
      if (sortBy.value === 'recommended' && !append) {
        console.log('=== 추천순 정렬 적용 (Discover) ===')
        console.log('찜한 영화 개수:', wishlist.value.length)
        console.log('추천 영화 개수:', recommendedMovies.value.length)
        console.log('Discover 결과 개수:', resultsToDisplay.length)
        console.log('시청 플랫폼 필터:', selectedProvider.value || '없음')

        // 찜한 영화가 없거나 시청 플랫폼 필터가 있으면 인기순으로 표시
        if (wishlist.value.length === 0 || recommendedMovies.value.length === 0) {
          console.log('찜한 영화가 없습니다. 인기순으로 표시합니다.')
          // resultsToDisplay는 이미 인기순으로 정렬됨
        } else if (selectedProvider.value) {
          console.log('시청 플랫폼 필터가 적용되어 있어 추천 영화를 제외하고 discover 결과만 사용합니다.')
          // 시청 플랫폼 필터가 있을 때는 discover 결과만 사용 (이미 플랫폼 필터가 적용됨)
          // resultsToDisplay를 그대로 사용
        } else {
          // 추천 영화 중 필터와 매칭되는 것만 선택
          const filteredRecommendations = recommendedMovies.value.filter((movie) => {
            const matchesGenre = !selectedGenre.value || movie.genre_ids?.includes(Number(selectedGenre.value))
            const matchesRating = !selectedRating.value || movie.vote_average >= Number(selectedRating.value)
            return matchesGenre && matchesRating
          })

          console.log('필터링된 추천 영화 개수:', filteredRecommendations.length)

          // 추천 영화 ID 세트
          const recommendedIds = new Set(filteredRecommendations.map(m => m.id))

          // Discover 결과에서 추천 영화 제외 (중복 방지)
          const otherMovies = resultsToDisplay.filter(m => !recommendedIds.has(m.id))

          // 최대 20개의 추천 영화만 사용
          const topRecommendations = filteredRecommendations.slice(0, 20)

          // 추천 영화를 상단에, 나머지를 하단에 배치
          resultsToDisplay = [...topRecommendations, ...otherMovies]

          console.log('최종 결과 - 추천:', topRecommendations.length, '일반:', otherMovies.length)
          console.log('상위 5개 영화:', resultsToDisplay.slice(0, 5).map(m => m.title))
        }
      }

      if (append) {
        movies.value = [...movies.value, ...resultsToDisplay]
      } else {
        movies.value = resultsToDisplay
      }

      hasMorePages.value = page < response.total_pages
      if (append) currentPage.value = page
    }
  } catch (err) {
    console.error('영화 검색 실패:', err)
  } finally {
    loading.value = false
    isLoadingMore.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedGenre.value = ''
  selectedRating.value = ''
  selectedProvider.value = ''
  sortBy.value = 'recommended'
  currentPage.value = 1
  searchMovies()
}

const handleMovieClick = (movie: Movie) => {
  selectedMovie.value = movie
  showModal.value = true
}

const handleCloseModal = () => {
  showModal.value = false
  setTimeout(() => {
    selectedMovie.value = null
  }, 300)
}

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300

  if (isLoadingMore.value || !hasMorePages.value) return

  const scrollBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500

  if (scrollBottom) {
    searchMovies(true)
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = window.setTimeout(() => {
    if (searchQuery.value.trim()) {
      searchMovies()
    }
  }, 500)
}

const handleSearchFocus = () => {
  showSearchHistory.value = true
}

const handleSearchBlur = () => {
  // 약간의 딜레이를 줘서 클릭 이벤트가 처리되도록 함
  setTimeout(() => {
    showSearchHistory.value = false
  }, 200)
}

const selectSearchHistory = (query: string) => {
  searchQuery.value = query
  showSearchHistory.value = false
  searchMovies()
}

const handleDeleteHistory = (query: string) => {
  removeSearchQuery(query)
}

const handleClearAllHistory = () => {
  if (confirm('모든 검색 기록을 삭제하시겠습니까?')) {
    clearSearchHistory()
  }
}

const handleFilterChange = () => {
  searchMovies()
}

onMounted(async () => {
  loadGenres()
  loadWatchProviders()
  await loadRecommendedMovies()
  searchMovies()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})

// 찜 목록이 변경되면 추천 영화 백그라운드에서 업데이트 (검색 결과는 새로고침 안 함)
watch(() => wishlist.value.length, async () => {
  await loadRecommendedMovies()
  // searchMovies()를 호출하지 않아서 사용자가 보고 있는 결과는 유지됨
  // 다음에 검색하거나 필터를 변경할 때 업데이트된 추천 목록이 사용됨
})
</script>

<template>
  <div>
    <AppHeader />

    <main class="page-container">
      <div class="container">
        <h1 class="section-title">
          <i class="fas fa-search" style="color: var(--primary-color)"></i> 찾아보기
        </h1>

        <!-- 검색 바 -->
        <div class="search-bar-container">
          <div class="search-bar">
            <input
              type="text"
              class="search-input"
              v-model="searchQuery"
              @input="handleSearchInput"
              @focus="handleSearchFocus"
              @blur="handleSearchBlur"
              placeholder="영화 제목을 검색하세요..."
            />
            <button
              v-if="searchQuery"
              class="clear-input-btn"
              @click="searchQuery = ''"
              title="입력 지우기"
            >
              <i class="fas fa-times"></i>
            </button>
            <i class="fas fa-search search-icon"></i>
          </div>

          <!-- 검색 히스토리 드롭다운 -->
          <Transition name="dropdown">
            <div
              v-if="showSearchHistory && recentSearches.length > 0"
              class="search-history-dropdown"
            >
              <div class="history-header">
                <span class="history-title">
                  <i class="fas fa-history"></i> 최근 검색어
                </span>
                <button class="clear-all-btn" @click="handleClearAllHistory">
                  전체 삭제
                </button>
              </div>
              <ul class="history-list">
                <li v-for="item in recentSearches" :key="item.query" class="history-item">
                  <button class="history-query-btn" @click="selectSearchHistory(item.query)">
                    <i class="fas fa-clock history-icon"></i>
                    <span class="history-text">{{ item.query }}</span>
                  </button>
                  <button
                    class="delete-history-btn"
                    @click="handleDeleteHistory(item.query)"
                    title="삭제"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </li>
              </ul>
            </div>
          </Transition>
        </div>

        <div class="filter-section">
          <div class="filter-header">
            <h3 class="filter-title">필터</h3>
            <button class="btn btn-secondary filter-reset" @click="resetFilters">
              <i class="fas fa-redo"></i> 초기화
            </button>
          </div>

          <div class="filter-grid">
            <div class="filter-group">
              <label class="filter-label" for="genre">장르</label>
              <select
                id="genre"
                class="filter-select"
                v-model="selectedGenre"
                @change="handleFilterChange"
              >
                <option value="">전체</option>
                <option v-for="genre in genres" :key="genre.id" :value="genre.id">
                  {{ genre.name }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label" for="rating">최소 평점</label>
              <select
                id="rating"
                class="filter-select"
                v-model="selectedRating"
                @change="handleFilterChange"
              >
                <option value="">전체</option>
                <option value="9">9.0 이상</option>
                <option value="8">8.0 이상</option>
                <option value="7">7.0 이상</option>
                <option value="6">6.0 이상</option>
                <option value="5">5.0 이상</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label" for="provider">시청 플랫폼</label>
              <select
                id="provider"
                class="filter-select"
                v-model="selectedProvider"
                @change="handleFilterChange"
              >
                <option value="">전체</option>
                <option v-for="provider in watchProviders" :key="provider.provider_id" :value="provider.provider_id">
                  {{ provider.provider_name }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label" for="sort">정렬</label>
              <select id="sort" class="filter-select" v-model="sortBy" @change="handleFilterChange">
                <option value="recommended">추천순</option>
                <option value="popularity.desc">인기순 (높은순)</option>
                <option value="popularity.asc">인기순 (낮은순)</option>
                <option value="vote_average.desc">평점순 (높은순)</option>
                <option value="vote_average.asc">평점순 (낮은순)</option>
                <option value="release_date.desc">개봉일 (최신순)</option>
                <option value="release_date.asc">개봉일 (오래된순)</option>
                <option value="title.asc">제목 (가나다순)</option>
              </select>
            </div>
          </div>
        </div>

        <LoadingSpinner v-if="loading" text="영화를 검색하는 중..." />

        <div v-else-if="movies.length === 0" class="empty-state">
          <i class="fas fa-search empty-state-icon"></i>
          <h2 class="empty-state-title">검색 결과가 없습니다</h2>
          <p class="empty-state-description">다른 필터를 선택해보세요</p>
        </div>

        <div v-else class="movie-grid">
          <LargeMovieCard v-for="movie in movies" :key="movie.id" :movie="movie" @click="handleMovieClick" />
          <MovieCardSkeleton v-if="isLoadingMore" v-for="i in 6" :key="'skeleton-' + i" />
        </div>

        <button
          class="scroll-top-btn"
          :class="{ visible: showScrollTop }"
          @click="scrollToTop"
        >
          <i class="fas fa-arrow-up"></i>
        </button>
      </div>
    </main>

    <AppFooter />

    <MovieDetailModal :movie="selectedMovie" :show="showModal" @close="handleCloseModal" />
  </div>
</template>

<style scoped>
.search-bar-container {
  position: relative;
  margin-bottom: 2rem;
}

.search-bar {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 1rem 7rem 1rem 1.5rem;
  font-size: 1rem;
  background-color: var(--bg-light);
  border: 2px solid var(--border-color);
  border-radius: 50px;
  color: var(--text-primary);
  transition: all var(--transition-speed) var(--transition-ease);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-input-btn {
  position: absolute;
  right: 4rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: color var(--transition-speed);
  z-index: 1;
}

.clear-input-btn:hover {
  color: var(--primary-color);
}

.search-icon {
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 1.25rem;
  pointer-events: none;
}

/* 검색 히스토리 드롭다운 */
.search-history-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  background-color: var(--bg-light);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 100;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(255, 255, 255, 0.03);
}

.history-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.history-title i {
  color: var(--primary-color);
  font-size: 0.85rem;
}

.clear-all-btn {
  padding: 0.375rem 0.875rem;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all var(--transition-speed);
}

.clear-all-btn:hover {
  background-color: rgba(229, 9, 20, 0.1);
  color: var(--primary-color);
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 320px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  transition: background-color var(--transition-speed);
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.history-query-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.history-icon {
  color: var(--text-muted);
  font-size: 0.85rem;
  flex-shrink: 0;
}

.history-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-history-btn {
  padding: 0.875rem 1.25rem;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  transition: color var(--transition-speed);
  flex-shrink: 0;
}

.delete-history-btn:hover {
  color: var(--primary-color);
}

/* 드롭다운 애니메이션 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-5px);
}

/* 스크롤바 스타일 */
.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: transparent;
}

.history-list::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .search-bar {
    max-width: 100%;
  }

  .search-input {
    padding: 0.875rem 6rem 0.875rem 1.25rem;
    font-size: 0.95rem;
  }

  .clear-input-btn {
    right: 3.5rem;
    font-size: 1rem;
  }

  .search-icon {
    right: 1.25rem;
    font-size: 1.1rem;
  }

  .search-history-dropdown {
    max-width: calc(100% - 2rem);
  }

  .history-header,
  .history-query-btn,
  .delete-history-btn {
    padding: 0.75rem 1rem;
  }

  .history-title {
    font-size: 0.85rem;
  }

  .clear-all-btn {
    padding: 0.25rem 0.625rem;
    font-size: 0.8rem;
  }

  .history-query-btn {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .search-input {
    padding: 0.75rem 5.5rem 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .clear-input-btn {
    right: 3rem;
    font-size: 0.95rem;
    padding: 0.375rem;
  }

  .search-icon {
    right: 1rem;
    font-size: 1rem;
  }

  .history-list {
    max-height: 240px;
  }

  .history-header,
  .history-query-btn,
  .delete-history-btn {
    padding: 0.625rem 0.875rem;
  }
}
</style>