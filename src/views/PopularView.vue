<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import LargeMovieCard from '@/components/LargeMovieCard.vue'
import MovieSlider from '@/components/MovieSlider.vue'
import MovieDetailModal from '@/components/MovieDetailModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import InfiniteScrollView from '@/components/InfiniteScrollView.vue'
import TableView from '@/components/TableView.vue'
import type { Movie } from '@/types/movie'
import { getPopularMovies, getBackdropUrl } from '@/utils/tmdb'

const firstPageMovies = ref<Movie[]>([])
const topMovies = ref<Movie[]>([])
const loading = ref(false)
const showScrollTop = ref(false)
const selectedMovie = ref<Movie | null>(null)
const showModal = ref(false)
const heroMovie = ref<Movie | null>(null)
const viewMode = ref<'infinite' | 'table'>('infinite')
const moreMoviesSection = ref<HTMLElement | null>(null)
let heroInterval: number | null = null

const isTableView = computed(() => viewMode.value === 'table')

const loadInitialData = async () => {
  try {
    loading.value = true
    const response = await getPopularMovies(1)
    const movies = response.results
    topMovies.value = movies.slice(0, 10)
    firstPageMovies.value = movies.slice(10)

    if (response.results.length > 0) {
      startHeroRotation()
    }
  } catch (err) {
    console.error('영화 데이터 로드 실패:', err)
  } finally {
    loading.value = false
  }
}

const switchViewMode = (mode: 'infinite' | 'table') => {
  viewMode.value = mode
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

const handlePageChange = () => {
  if (moreMoviesSection.value) {
    const headerOffset = 80
    const elementPosition = moreMoviesSection.value.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
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

            <MovieSlider
              :movies="topMovies"
              :autoplay="true"
              :autoplay-delay="3500"
              :pagination="true"
              custom-class="top-movies-slider"
            >
              <template #default="{ movie }">
                <div class="top-movie-card" @click="handleMovieClick(movie)">
                  <div class="top-movie-rank">{{ topMovies.indexOf(movie) + 1 }}</div>
                  <LargeMovieCard :movie="movie" />
                </div>
              </template>
            </MovieSlider>
          </section>

          <!-- First Page Movies Slider -->
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">
                지금 인기 있는 영화
              </h2>
            </div>

            <MovieSlider :movies="firstPageMovies">
              <template #default="{ movie }">
                <LargeMovieCard :movie="movie" @click="handleMovieClick" />
              </template>
            </MovieSlider>
          </section>

          <!-- View Section with Toggle -->
          <section ref="moreMoviesSection" class="section">
            <div class="section-header">
              <h2 class="section-title">더 많은 인기 영화</h2>
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
            </div>

            <!-- Views Container with Transition -->
            <div class="views-container">
              <Transition name="view-fade" mode="out-in">
                <KeepAlive>
                  <InfiniteScrollView v-if="!isTableView" key="infinite" @movie-click="handleMovieClick" />
                  <TableView v-else key="table" @movie-click="handleMovieClick" @page-change="handlePageChange" />
                </KeepAlive>
              </Transition>
            </div>
          </section>
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
  margin-bottom: 1rem;
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

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--primary-color), #ff6b35);
  color: var(--text-primary);
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  width: fit-content;
  box-shadow: 0 4px 15px rgba(230, 57, 70, 0.4);
}

/* PopularView specific overrides */
.hero-banner-title {
  font-size: 3.5rem;
  text-shadow: 2px 2px 20px rgba(0, 0, 0, 0.9);
}

.hero-banner-rating {
  font-weight: 700;
  font-size: 1.2rem;
}

.hero-banner-year {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.hero-banner-description {
  max-width: 700px;
  font-size: 1.15rem;
  line-height: 1.7;
  text-shadow: 1px 1px 8px rgba(0, 0, 0, 0.9);
}

.hero-banner-actions .btn {
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(230, 57, 70, 0.4);
  transition: all 0.3s ease;
}

.hero-banner-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(230, 57, 70, 0.6);
}

/* Hero Fade override */
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 0.8s ease;
}

/* View Fade Transition */
.views-container {
  position: relative;
  min-height: 400px;
}

.view-fade-enter-active {
  transition: all 0.3s ease-out;
}

.view-fade-leave-active {
  transition: all 0.2s ease-in;
}

.view-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Section Header Override */
.section .section-header {
  margin-bottom: 0rem;
}

/* All Movie Sliders */
.top-movies-slider,
:deep(.movies-slider) {
  padding: 0.25rem 0 1rem !important;
}

:deep(.movies-slider .swiper) {
  padding: 0.25rem 0 0.5rem !important;
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
.view-mode-toggle {
  display: flex;
  gap: 0.5rem;
  background-color: var(--bg-light);
  padding: 0.25rem;
  border-radius: 8px;
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

/* ... other styles ... */

@media (max-width: 1024px) {
  .table-view-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .view-mode-btn {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
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
  .view-mode-btn {
    font-size: 0.8rem;
    padding: 0.5rem 0.6rem;
  }

  .view-mode-btn i {
    font-size: 0.9rem;
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
