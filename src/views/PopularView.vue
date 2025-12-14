<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import LargeMovieCard from '@/components/LargeMovieCard.vue'
import MovieCardSkeleton from '@/components/MovieCardSkeleton.vue'
import MovieDetailModal from '@/components/MovieDetailModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { Movie } from '@/types/movie'
import { getPopularMovies, getBackdropUrl } from '@/utils/tmdb'

const firstPageMovies = ref<Movie[]>([])
const additionalMovies = ref<Movie[]>([])
const topMovies = ref<Movie[]>([])
const tableMovies = ref<Movie[]>([])
const loading = ref(false)
const isLoadingMore = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const showScrollTop = ref(false)
const selectedMovie = ref<Movie | null>(null)
const showModal = ref(false)
const heroMovie = ref<Movie | null>(null)
const viewMode = ref<'infinite' | 'table'>('infinite')
let heroInterval: number | null = null

const modules = [Navigation, Pagination, Autoplay]

const isTableView = computed(() => viewMode.value === 'table')

const loadInitialData = async () => {
  try {
    loading.value = true
    const response = await getPopularMovies(1)
    const movies = response.results
    topMovies.value = movies.slice(0, 10)
    firstPageMovies.value = movies.slice(10)
    totalPages.value = response.total_pages

    if (response.results.length > 0) {
      startHeroRotation()
    }
  } catch (err) {
    console.error('영화 데이터 로드 실패:', err)
  } finally {
    loading.value = false
  }
}

const loadAdditionalMovies = async (page: number, append: boolean = false) => {
  try {
    if (append) {
      isLoadingMore.value = true
    } else {
      loading.value = true
    }

    const response = await getPopularMovies(page)

    if (isTableView.value) {
      // Table View 모드
      tableMovies.value = response.results
    } else {
      // Infinite Scroll 모드
      if (append) {
        additionalMovies.value = [...additionalMovies.value, ...response.results]
      } else {
        additionalMovies.value = response.results
      }
    }

    currentPage.value = page
  } catch (err) {
    console.error('영화 데이터 로드 실패:', err)
  } finally {
    loading.value = false
    isLoadingMore.value = false
  }
}

const switchViewMode = (mode: 'infinite' | 'table') => {
  viewMode.value = mode
  currentPage.value = 2
  additionalMovies.value = []
  tableMovies.value = []
  loadAdditionalMovies(2)
}

const goToPage = (page: number) => {
  if (page >= 2 && page <= totalPages.value) {
    loadAdditionalMovies(page)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1)
  }
}

const prevPage = () => {
  if (currentPage.value > 2) {
    goToPage(currentPage.value - 1)
  }
}

const selectRandomHeroMovie = () => {
  if (topMovies.value.length > 0) {
    // Top 3 영화 중에서 랜덤 선택
    const topThree = topMovies.value.slice(0, 3)
    const randomIndex = Math.floor(Math.random() * topThree.length)
    heroMovie.value = topThree[randomIndex] ?? null
  }
}

const startHeroRotation = () => {
  selectRandomHeroMovie()
  heroInterval = window.setInterval(() => {
    selectRandomHeroMovie()
  }, 5000)
}

const stopHeroRotation = () => {
  if (heroInterval) {
    clearInterval(heroInterval)
    heroInterval = null
  }
}

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300

  // 무한 스크롤은 infinite 모드에서만 작동
  if (!isTableView.value && !loading.value && !isLoadingMore.value) {
    const scrollBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500

    if (scrollBottom && currentPage.value < totalPages.value) {
      loadAdditionalMovies(currentPage.value + 1, true)
    }
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
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

onMounted(() => {
  loadInitialData()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  stopHeroRotation()
})
</script>

<template>
  <div>
    <AppHeader />

    <!-- Hero Banner -->
    <Transition name="hero-fade" mode="out-in">
      <div v-if="heroMovie && !loading" :key="heroMovie.id" class="hero-banner">
          <img
            :src="getBackdropUrl(heroMovie.backdrop_path)"
            :alt="heroMovie.title"
            class="hero-banner-bg"
          />
          <div class="hero-banner-overlay"></div>
          <div class="hero-banner-content">
            <div class="hero-badge">
              <i class="fas fa-fire"></i>
              인기 급상승
            </div>
            <h1 class="hero-banner-title">{{ heroMovie.title }}</h1>
            <div class="hero-banner-meta">
              <span class="hero-banner-rating">
                <i class="fas fa-star"></i>
                {{ heroMovie.vote_average.toFixed(1) }}
              </span>
              <span class="hero-banner-year">
                {{ heroMovie.release_date?.split('-')[0] || 'N/A' }}
              </span>
            </div>
            <p class="hero-banner-description">
              {{ heroMovie.overview || '지금 가장 인기 있는 영화를 만나보세요!' }}
            </p>
            <div class="hero-banner-actions">
              <button class="btn btn-primary" @click="handleMovieClick(heroMovie)">
                <i class="fas fa-play"></i> 상세보기
              </button>
            </div>
        </div>
      </div>
    </Transition>

    <main class="page-container">
      <div class="container">
        <LoadingSpinner v-if="loading" text="영화 목록을 불러오는 중..." />

        <div v-else>
          <!-- Top 10 Section with Slider -->
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">
                Top 10 인기 영화
              </h2>
            </div>

            <Swiper
              :modules="modules"
              :slides-per-view="2.7"
              :space-between="15"
              :navigation="true"
              :loop="true"
              :pagination="{ clickable: true }"
              :autoplay="{ delay: 3500, disableOnInteraction: false }"
              :breakpoints="{
                320: { slidesPerView: 2, spaceBetween: 10 },
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="top-movies-slider"
            >
              <SwiperSlide v-for="(movie, index) in topMovies" :key="movie.id">
                <div class="top-movie-card" @click="handleMovieClick(movie)">
                  <div class="top-movie-rank">{{ index + 1 }}</div>
                  <LargeMovieCard :movie="movie" />
                </div>
              </SwiperSlide>
            </Swiper>
          </section>

          <!-- First Page Movies Slider -->
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">
                지금 인기 있는 영화
              </h2>
            </div>

            <Swiper
              :modules="modules"
              :slides-per-view="2.7"
              :space-between="15"
              :navigation="true"
              :loop="true"
              :breakpoints="{
                320: { slidesPerView: 2, spaceBetween: 10 },
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in firstPageMovies" :key="movie.id">
                <LargeMovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <!-- View Mode Toggle -->
          <section class="view-mode-section">
            <div class="view-mode-toggle">
              <button
                class="view-mode-btn"
                :class="{ active: !isTableView }"
                @click="switchViewMode('infinite')"
              >
                <i class="fas fa-infinity"></i>
                무한 스크롤
              </button>
              <button
                class="view-mode-btn"
                :class="{ active: isTableView }"
                @click="switchViewMode('table')"
              >
                <i class="fas fa-table"></i>
                테이블 뷰
              </button>
            </div>
          </section>

          <!-- Table View Mode -->
          <section v-if="isTableView" class="section">
            <div class="section-header">
              <h2 class="section-title">더 많은 인기 영화</h2>
              <div class="section-info">
                페이지 {{ currentPage }} / {{ totalPages }}
              </div>
            </div>

            <div class="table-view-grid">
              <LargeMovieCard
                v-for="movie in tableMovies"
                :key="movie.id"
                :movie="movie"
                @click="handleMovieClick"
              />
            </div>

            <!-- Pagination -->
            <div class="pagination">
              <button
                class="pagination-btn"
                :disabled="currentPage === 2"
                @click="prevPage"
              >
                <i class="fas fa-chevron-left"></i>
                이전
              </button>

              <div class="pagination-info">
                페이지 {{ currentPage }} / {{ totalPages }}
              </div>

              <button
                class="pagination-btn"
                :disabled="currentPage === totalPages"
                @click="nextPage"
              >
                다음
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </section>

          <!-- Infinite Scroll Mode - Additional Movies Grid -->
          <section v-else-if="additionalMovies.length > 0" class="section">
            <div class="section-header">
              <h2 class="section-title">
                더 많은 인기 영화
              </h2>
              <div class="section-info">
                {{ additionalMovies.length }}개의 영화
              </div>
            </div>

            <div class="movie-grid">
              <LargeMovieCard v-for="movie in additionalMovies" :key="movie.id" :movie="movie" @click="handleMovieClick" />
            </div>
          </section>

          <!-- Loading More Skeleton -->
          <div v-if="isLoadingMore" class="loading-more">
            <MovieCardSkeleton v-for="i in 6" :key="'skeleton-' + i" />
          </div>

          <!-- Load More Info -->
          <div v-if="currentPage < totalPages" class="load-more-info">
            <p>
              <i class="fas fa-arrow-down"></i>
              아래로 스크롤하면 더 많은 영화를 볼 수 있습니다
            </p>
          </div>
          </div>
        </div>

        <button
          v-if="!isTableView"
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
/* Override page-container padding for hero */
.page-container {
  padding-top: 0;
}

/* Hero Banner Styles */
.hero-banner {
  position: relative;
  height: 90vh;
  min-height: 650px;
  max-height: 850px;
  margin-bottom: 3rem;
  overflow: hidden;
}

.hero-banner-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hero-banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.3) 0%,
    transparent 40%,
    transparent 70%,
    #141414 100%
  );
}

[data-theme='light'] .hero-banner-overlay {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.3) 0%,
    transparent 40%,
    transparent 70%,
    #f5f5f5 100%
  );
}

.hero-banner-content {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 3rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--primary-color), #ff6b35);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  width: fit-content;
  box-shadow: 0 4px 15px rgba(230, 57, 70, 0.4);
}

.hero-banner-title {
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 20px rgba(0, 0, 0, 0.9);
  line-height: 1.2;
}

.hero-banner-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.hero-banner-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffd700;
  font-weight: 700;
  font-size: 1.2rem;
}

.hero-banner-year {
  color: var(--text-secondary);
  font-weight: 500;
}

.hero-banner-description {
  max-width: 700px;
  font-size: 1.15rem;
  line-height: 1.7;
  margin-bottom: 2rem;
  text-shadow: 1px 1px 8px rgba(0, 0, 0, 0.9);
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-banner-actions {
  display: flex;
  gap: 1rem;
}

.hero-banner-actions .btn {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(230, 57, 70, 0.4);
  transition: all 0.3s ease;
}

.hero-banner-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(230, 57, 70, 0.6);
}

/* Hero Fade Transition */
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 0.8s ease;
}

.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

/* Top Movies Slider */
.top-movies-slider {
  padding: 1rem 0 1.5rem;
}

.top-movie-card {
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.top-movie-card:hover {
  transform: translateY(-5px);
}

.top-movie-card:hover .top-movie-rank {
  opacity: 0;
}

.top-movie-rank {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  min-width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 215, 0, 0.6);
  color: #ffd700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  z-index: 10;
  border-radius: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* View Mode Toggle */
.view-mode-section {
  margin-bottom: 2rem;
  padding-top: 2rem;
}

.view-mode-toggle {
  display: flex;
  gap: 1rem;
  justify-content: center;
  background-color: var(--bg-light);
  padding: 0.5rem;
  border-radius: 12px;
  width: fit-content;
  margin: 0 auto;
}

.view-mode-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-mode-btn:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.view-mode-btn.active {
  background-color: var(--primary-color);
  color: #ffffff;
}

.view-mode-btn i {
  font-size: 1.1rem;
}

/* Table View Grid */
.table-view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.section-info {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* ... other styles ... */

@media (max-width: 1024px) {
  .table-view-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .view-mode-toggle {
    width: 100%;
  }

  .view-mode-btn {
    flex: 1;
    justify-content: center;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .table-view-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  /* ... other styles ... */
  .top-movie-rank {
    min-width: 32px;
    height: 32px;
    font-size: 1rem;
    top: 0.5rem;
    left: 0.5rem;
    border-width: 1.5px;
  }
  /* ... other styles ... */
}

@media (max-width: 480px) {
  .view-mode-section {
    padding-top: 1rem;
    margin-bottom: 1.5rem;
  }

  .view-mode-btn {
    font-size: 0.85rem;
    padding: 0.6rem 0.75rem;
  }

  .view-mode-btn i {
    font-size: 1rem;
  }

  .table-view-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  /* ... other styles ... */
  .top-movie-rank {
    min-width: 30px;
    height: 30px;
    font-size: 0.95rem;
    top: 0.4rem;
    left: 0.4rem;
    border-width: 1.5px;
  }
  /* ... other styles ... */
}
</style>
