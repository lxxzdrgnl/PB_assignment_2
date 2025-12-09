<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import MovieCard from '@/components/MovieCard.vue'
import MovieDetailModal from '@/components/MovieDetailModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { Movie } from '@/types/movie'
import {
  getTrendingMovies,
  getPopularTvShows,
  getNowPlayingMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  discoverMovies,
  discoverTvShows
} from '@/utils/tmdb'
import { getBackdropUrl } from '@/utils/tmdb'

const dailyTrendingMovies = ref<Movie[]>([])
const popularTvShows = ref<Movie[]>([])
const nowPlayingMovies = ref<Movie[]>([])
const topRatedMovies = ref<Movie[]>([])
const upcomingMovies = ref<Movie[]>([])
const actionMovies = ref<Movie[]>([])
const comedyMovies = ref<Movie[]>([])
const romanceMovies = ref<Movie[]>([])
const sciFiMovies = ref<Movie[]>([])
const horrorMovies = ref<Movie[]>([])
const animationMovies = ref<Movie[]>([])
const documentaryMovies = ref<Movie[]>([])
const koreanMovies = ref<Movie[]>([])
const koreanTvShows = ref<Movie[]>([])

const loading = ref(true)
const error = ref<string | null>(null)
const selectedMovie = ref<Movie | null>(null)
const showModal = ref(false)
const heroMovie = ref<Movie | null>(null)
let heroInterval: number | null = null

const modules = [Navigation]

const allMovies = computed(() => [
  ...dailyTrendingMovies.value,
  ...nowPlayingMovies.value,
  ...upcomingMovies.value,
  ...koreanMovies.value
])

const selectRandomHeroMovie = () => {
  if (allMovies.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * allMovies.value.length)
    heroMovie.value = allMovies.value[randomIndex] ?? null
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

const mapTvShowToMovie = (tvShow: any): Movie => ({
  ...tvShow,
  title: tvShow.name,
  release_date: tvShow.first_air_date
})

const loadMovies = async () => {
  try {
    loading.value = true
    const [
      dailyTrending,
      popularTv,
      nowPlaying,
      topRated,
      upcoming,
      action,
      comedy,
      romance,
      sciFi,
      horror,
      animation,
      documentary,
      korean,
      koreanTv
    ] = await Promise.all([
      getTrendingMovies('day'),
      getPopularTvShows(),
      getNowPlayingMovies(),
      getTopRatedMovies(),
      getUpcomingMovies(),
      discoverMovies({ with_genres: '28' }),
      discoverMovies({ with_genres: '35' }),
      discoverMovies({ with_genres: '10749' }),
      discoverMovies({ with_genres: '878' }),
      discoverMovies({ with_genres: '27' }),
      discoverMovies({ with_genres: '16' }),
      discoverMovies({ with_genres: '99' }),
      discoverMovies({ with_origin_country: 'KR', sort_by: 'popularity.desc' }),
      discoverTvShows({ with_origin_country: 'KR', sort_by: 'popularity.desc' })
    ])

    dailyTrendingMovies.value = dailyTrending.results
    popularTvShows.value = popularTv.results.map(mapTvShowToMovie)
    nowPlayingMovies.value = nowPlaying.results
    topRatedMovies.value = topRated.results
    upcomingMovies.value = upcoming.results
    actionMovies.value = action.results
    comedyMovies.value = comedy.results
    romanceMovies.value = romance.results
    sciFiMovies.value = sciFi.results
    horrorMovies.value = horror.results
    animationMovies.value = animation.results
    documentaryMovies.value = documentary.results
    koreanMovies.value = korean.results
    koreanTvShows.value = koreanTv.results.map(mapTvShowToMovie)

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

    <main class="page-container">
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
              <h2 class="section-title">일간 트렌드 영화</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in dailyTrendingMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">인기 TV 프로그램</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in popularTvShows" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">현재 상영작</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in nowPlayingMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">개봉 예정</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in upcomingMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">높은 평점</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in topRatedMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">한국 인기 영화</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in koreanMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">한국 인기 TV 프로그램</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in koreanTvShows" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">추천 액션 영화</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in actionMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">추천 코미디 영화</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in comedyMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">추천 로맨스 영화</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in romanceMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">추천 SF 영화</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in sciFiMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>
          
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">추천 공포 영화</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in horrorMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">추천 애니메이션</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in animationMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">추천 다큐멘터리</h2>
            </div>
            <Swiper
              :modules="modules"
              :slides-per-view="2"
              :space-between="10"
              :navigation="true"
              :breakpoints="{
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="movies-slider"
            >
              <SwiperSlide v-for="movie in documentaryMovies" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>
        </div>
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

.hero-banner {
  position: relative;
  height: 90vh;
  min-height: 650px;
  max-height: 850px;
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
    180deg,
    rgba(0, 0, 0, 0.8) 0%,
    transparent 30%,
    transparent 60%,
    var(--bg-dark) 100%
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

/* Section Styles */
.section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
}

/* Movies Slider */
.movies-slider {
  padding: 1rem 0 1.5rem;
}

/* Specific fix for title-slider spacing */
.section-header h2.section-title {
  margin-bottom: 0; /* Reset default h2 margin */
}

/* Swiper Custom Styles */
:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: var(--primary-color);
  background: rgba(0, 0, 0, 0.5);
  width: 45px;
  height: 45px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

:deep(.swiper-button-next:hover),
:deep(.swiper-button-prev:hover) {
  background: var(--primary-color);
  color: white;
}

:deep(.swiper-button-next::after),
:deep(.swiper-button-prev::after) {
  font-size: 1.2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-banner {
    height: 45vh;
    min-height: 350px;
    max-height: 450px;
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

  .section-title {
    font-size: 1.4rem;
  }
}

@media (max-width: 480px) {
  .hero-banner {
    height: 55vh;
    min-height: 300px;
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

  .section-title {
    font-size: 1.2rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  :deep(.swiper-button-next),
  :deep(.swiper-button-prev) {
    width: 35px;
    height: 35px;
  }

  :deep(.swiper-button-next::after),
  :deep(.swiper-button-prev::after) {
    font-size: 1rem;
  }
}
</style>