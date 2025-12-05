<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import MovieCard from '@/components/MovieCard.vue'
import MovieDetailModal from '@/components/MovieDetailModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { Movie, Genre } from '@/types/movie'
import { discoverMovies, getGenres, searchMovies as searchMoviesAPI } from '@/utils/tmdb'

const movies = ref<Movie[]>([])
const genres = ref<Genre[]>([])
const loading = ref(false)
const selectedGenre = ref<string>('')
const selectedRating = ref<string>('')
const sortBy = ref<string>('popularity.desc')
const selectedMovie = ref<Movie | null>(null)
const showModal = ref(false)
const searchQuery = ref<string>('')
const currentPage = ref(1)
const hasMorePages = ref(true)
const isLoadingMore = ref(false)
const showScrollTop = ref(false)
let searchTimeout: number | null = null

const loadGenres = async () => {
  try {
    genres.value = await getGenres()
  } catch (err) {
    console.error('장르 목록 로드 실패:', err)
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
      if (sortBy.value === 'popularity.desc') {
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
        sort_by: sortBy.value,
        page: page,
      }

      if (selectedGenre.value) {
        params.with_genres = selectedGenre.value
      }

      if (selectedRating.value) {
        params['vote_average.gte'] = selectedRating.value
      }

      const response = await discoverMovies(params)

      if (append) {
        movies.value = [...movies.value, ...response.results]
      } else {
        movies.value = response.results
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
  sortBy.value = 'popularity.desc'
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
    searchMovies()
  }, 500)
}

const handleFilterChange = () => {
  searchMovies()
}

onMounted(() => {
  loadGenres()
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
              placeholder="영화 제목을 검색하세요..."
            />
            <i class="fas fa-search search-icon"></i>
          </div>
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
              <label class="filter-label" for="sort">정렬</label>
              <select id="sort" class="filter-select" v-model="sortBy" @change="handleFilterChange">
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
        </div>

        <LoadingSpinner v-if="isLoadingMore" text="더 많은 영화를 불러오는 중..." />

        <button
          class="scroll-top-btn"
          :class="{ visible: showScrollTop }"
          @click="scrollToTop"
        >
          <i class="fas fa-arrow-up"></i>
        </button>
      </div>
    </main>

    <MovieDetailModal :movie="selectedMovie" :show="showModal" @close="handleCloseModal" />
  </div>
</template>

<style scoped>
.search-bar-container {
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
  padding: 1rem 3rem 1rem 1.5rem;
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

.search-icon {
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 1.25rem;
  pointer-events: none;
}

@media (max-width: 768px) {
  .search-bar {
    max-width: 100%;
  }

  .search-input {
    padding: 0.875rem 2.5rem 0.875rem 1.25rem;
    font-size: 0.95rem;
  }

  .search-icon {
    right: 1.25rem;
    font-size: 1.1rem;
  }
}
</style>
