<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import MovieCard from '@/components/MovieCard.vue'
import MovieDetailModal from '@/components/MovieDetailModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { Movie } from '@/types/movie'
import {
  getPopularMovies,
  getNowPlayingMovies,
  getTopRatedMovies,
  getUpcomingMovies,
} from '@/utils/tmdb'
import { getBackdropUrl } from '@/utils/tmdb'

const popularMovies = ref<Movie[]>([])
const nowPlayingMovies = ref<Movie[]>([])
const topRatedMovies = ref<Movie[]>([])
const upcomingMovies = ref<Movie[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedMovie = ref<Movie | null>(null)
const showModal = ref(false)
const heroMovie = ref<Movie | null>(null)
let heroInterval: number | null = null

const allMovies = computed(() => [
  ...popularMovies.value,
  ...nowPlayingMovies.value,
  ...topRatedMovies.value,
  ...upcomingMovies.value,
])

const selectRandomHeroMovie = () => {
  if (allMovies.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * allMovies.value.length)
    heroMovie.value = allMovies.value[randomIndex]
  }
}

const startHeroRotation = () => {
  selectRandomHeroMovie()
  heroInterval = window.setInterval(() => {
    selectRandomHeroMovie()
  }, 4000)
}

const stopHeroRotation = () => {
  if (heroInterval) {
    clearInterval(heroInterval)
    heroInterval = null
  }
}

const loadMovies = async () => {
  try {
    loading.value = true
    const [popular, nowPlaying, topRated, upcoming] = await Promise.all([
      getPopularMovies(),
      getNowPlayingMovies(),
      getTopRatedMovies(),
      getUpcomingMovies(),
    ])

    popularMovies.value = popular.results.slice(0, 10)
    nowPlayingMovies.value = nowPlaying.results.slice(0, 10)
    topRatedMovies.value = topRated.results.slice(0, 10)
    upcomingMovies.value = upcoming.results.slice(0, 10)

    // 영화 로드 후 히어로 배너 시작
    startHeroRotation()
  } catch (err) {
    error.value = 'API 키가 유효하지 않습니다. 로그아웃 후 올바른 TMDB API 키로 다시 로그인해주세요.'
    console.error('영화 데이터 로드 실패:', err)
  } finally {
    loading.value = false
  }
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
  loadMovies()
})

onUnmounted(() => {
  stopHeroRotation()
})
</script>

<template>
  <div>
    <AppHeader />

    <main class="page-container">
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

      <div class="container">
        <LoadingSpinner v-if="loading" text="영화 목록을 불러오는 중..." />

        <div v-else-if="error" class="empty-state">
          <i class="fas fa-exclamation-triangle empty-state-icon"></i>
          <h2 class="empty-state-title">오류가 발생했습니다</h2>
          <p class="empty-state-description">{{ error }}</p>
        </div>

        <div v-else>
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">
                <i class="fas fa-fire" style="color: var(--primary-color)"></i> 인기 영화
              </h2>
            </div>
            <div class="movie-grid">
              <MovieCard v-for="movie in popularMovies" :key="movie.id" :movie="movie" @click="handleMovieClick" />
            </div>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">
                <i class="fas fa-play-circle" style="color: var(--primary-color)"></i> 현재 상영작
              </h2>
            </div>
            <div class="movie-grid">
              <MovieCard v-for="movie in nowPlayingMovies" :key="movie.id" :movie="movie" @click="handleMovieClick" />
            </div>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">
                <i class="fas fa-star" style="color: #ffd700"></i> 높은 평점
              </h2>
            </div>
            <div class="movie-grid">
              <MovieCard v-for="movie in topRatedMovies" :key="movie.id" :movie="movie" @click="handleMovieClick" />
            </div>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">
                <i class="fas fa-calendar-alt" style="color: var(--primary-color)"></i> 개봉 예정
              </h2>
            </div>
            <div class="movie-grid">
              <MovieCard v-for="movie in upcomingMovies" :key="movie.id" :movie="movie" @click="handleMovieClick" />
            </div>
          </section>
        </div>
      </div>
    </main>

    <MovieDetailModal :movie="selectedMovie" :show="showModal" @close="handleCloseModal" />
  </div>
</template>

<style scoped>
.hero-banner {
  position: relative;
  height: 70vh;
  min-height: 550px;
  max-height: 700px;
  margin-bottom: 2rem;
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
    0deg,
    var(--bg-dark) 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.7) 100%
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

.hero-banner-title {
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.8);
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
  font-weight: 600;
}

.hero-banner-year {
  color: var(--text-secondary);
}

.hero-banner-description {
  max-width: 600px;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.8);
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
}

/* Hero Fade Transition */
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 0.5s ease;
}

.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-banner {
    height: 55vh;
    min-height: 400px;
  }

  .hero-banner-content {
    padding: 0 1rem;
    padding-bottom: 2rem;
  }

  .hero-banner-title {
    font-size: 2rem;
  }

  .hero-banner-meta {
    font-size: 0.95rem;
    gap: 1rem;
  }

  .hero-banner-description {
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
    -webkit-line-clamp: 2;
  }

  .hero-banner-actions .btn {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .hero-banner {
    height: 50vh;
    min-height: 350px;
  }

  .hero-banner-title {
    font-size: 1.5rem;
  }

  .hero-banner-meta {
    font-size: 0.85rem;
  }

  .hero-banner-description {
    font-size: 0.85rem;
  }

  .hero-banner-actions {
    flex-direction: column;
  }

  .hero-banner-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
