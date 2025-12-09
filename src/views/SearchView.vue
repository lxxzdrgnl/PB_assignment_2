<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import MovieCard from '@/components/MovieCard.vue'
import MovieCardSkeleton from '@/components/MovieCardSkeleton.vue'
import MovieDetailModal from '@/components/MovieDetailModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { Movie, Genre } from '@/types/movie'
import { discoverMovies, getGenres, searchMovies as searchMoviesAPI, getAvailableWatchProviders } from '@/utils/tmdb'
import { useSearchHistory } from '@/composables/useSearchHistory'

const movies = ref<Movie[]>([])
const genres = ref<Genre[]>([])
const watchProviders = ref<any[]>([])
const loading = ref(false)
const selectedGenre = ref<string>('')
const selectedRating = ref<string>('')
const selectedProvider = ref<string>('')
const sortBy = ref<string>('random') // Changed to 'random'
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

// 최근 검색어 가져오기 (최대 10개)
const recentSearches = computed(() => getRecentSearches(10))

// 배열 섞기 함수 (Fisher-Yates shuffle)
const shuffleArray = (array: Movie[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

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
      if (sortBy.value === 'random') {
        newMovies = shuffleArray(newMovies); // Shuffle for random
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
      // sort_by가 'random'이 아닌 경우에만 API에 정렬 파라미터 전송
      if (sortBy.value !== 'random') {
        params.sort_by = sortBy.value
      } else {
        // 'random'일 경우, 기본 정렬 기준을 사용하거나 파라미터를 아예 보내지 않음 (여기서는 인기순을 기본으로)
        // TMDB discover API는 sort_by가 없으면 기본으로 popularity.desc로 정렬됨
        // 또는, 명시적으로 다른 기준을 지정할 수 있음
        // params.sort_by = 'popularity.desc'; // 명시적으로 인기순을 기본으로 할 경우
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

      let resultsToDisplay = response.results;
      if (sortBy.value === 'random') {
          resultsToDisplay = shuffleArray(resultsToDisplay); // Shuffle for random
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
  sortBy.value = 'random' // Changed to 'random'
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

onMounted(() => {
  loadGenres()
  loadWatchProviders()
  searchMovies()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
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
                <option value="random">랜덤</option>
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
          <MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" @click="handleMovieClick" />
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