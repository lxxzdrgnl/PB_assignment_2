<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Autoplay } from 'swiper/modules'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import MovieCard from '@/components/MovieCard.vue'
import MovieDetailModal from '@/components/MovieDetailModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { Movie } from '@/types/movie'
import { useWishlist } from '@/composables/useWishlist'
import { useRecommendations } from '@/composables/useRecommendations'

const { wishlist } = useWishlist()
const { recommendations, loading: recommendationsLoading, getRecommendationsFromWishlist } = useRecommendations()

const hasMovies = computed(() => wishlist.value.length > 0)
const hasRecommendations = computed(() => recommendations.value.length > 0)
const selectedMovie = ref<Movie | null>(null)
const showModal = ref(false)
const sortBy = ref<string>('date_added') // 추가된 순서
const filterGenre = ref<string>('')

const modules = [Navigation, Autoplay]

// 통계 계산
const stats = computed(() => {
  if (wishlist.value.length === 0) return null

  const movies = wishlist.value
  const totalMovies = movies.length

  // 장르별 카운트
  const genreCounts: Record<number, number> = {}
  movies.forEach(movie => {
    movie.genre_ids?.forEach(genreId => {
      genreCounts[genreId] = (genreCounts[genreId] || 0) + 1
    })
  })

  // 가장 좋아하는 장르 (1위)
  const topGenreEntry = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])[0]
  const favoriteGenre = topGenreEntry ? {
    id: Number(topGenreEntry[0]),
    name: genreNames[Number(topGenreEntry[0])] || '기타',
    count: topGenreEntry[1],
    percentage: Math.round((topGenreEntry[1] / totalMovies) * 100)
  } : null

  // 개봉 연도 분석
  const years = movies
    .map(m => m.release_date?.split('-')[0])
    .filter(Boolean)
    .map(Number)

  // 연대별 그룹화 (2020년대, 2010년대, 2000년대, 그 이전)
  const decadeCounts: Record<string, number> = {}
  years.forEach(year => {
    let decade: string
    if (year >= 2020) decade = '2020년대'
    else if (year >= 2010) decade = '2010년대'
    else if (year >= 2000) decade = '2000년대'
    else if (year >= 1990) decade = '1990년대'
    else decade = '클래식'

    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1
  })

  const favoriteDecadeEntry = Object.entries(decadeCounts)
    .sort((a, b) => b[1] - a[1])[0]
  const favoriteDecade = favoriteDecadeEntry ? {
    decade: favoriteDecadeEntry[0],
    count: favoriteDecadeEntry[1],
    percentage: Math.round((favoriteDecadeEntry[1] / totalMovies) * 100)
  } : null

  // 시청 시간 계산 (평균 러닝타임이 없으므로 평균 2시간으로 가정)
  const estimatedHours = Math.round((totalMovies * 120) / 60)

  // 한국 영화 vs 외국 영화
  const koreanMovies = movies.filter(m => m.original_language === 'ko').length
  const globalMovies = totalMovies - koreanMovies
  const koreanPercentage = Math.round((koreanMovies / totalMovies) * 100)
  const isKoreanPreferred = koreanMovies > globalMovies

  return {
    totalMovies,
    favoriteGenre,
    favoriteDecade,
    estimatedHours,
    koreanMovies,
    globalMovies,
    koreanPercentage,
    isKoreanPreferred
  }
})

// 필터링 및 정렬된 영화 목록
const filteredAndSortedMovies = computed(() => {
  let movies = [...wishlist.value]

  // 장르 필터
  if (filterGenre.value) {
    movies = movies.filter(m => m.genre_ids?.includes(Number(filterGenre.value)))
  }

  // 정렬
  switch (sortBy.value) {
    case 'date_added':
      // 기본 순서 (추가된 순서 그대로)
      break
    case 'rating_desc':
      movies.sort((a, b) => b.vote_average - a.vote_average)
      break
    case 'rating_asc':
      movies.sort((a, b) => a.vote_average - b.vote_average)
      break
    case 'title_asc':
      movies.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'release_date_desc':
      movies.sort((a, b) => b.release_date.localeCompare(a.release_date))
      break
    case 'release_date_asc':
      movies.sort((a, b) => a.release_date.localeCompare(b.release_date))
      break
  }

  return movies
})

// 장르 목록 (찜한 영화에서 추출)
const availableGenres = computed(() => {
  const genreSet = new Set<number>()
  wishlist.value.forEach(movie => {
    movie.genre_ids?.forEach(id => genreSet.add(id))
  })
  return Array.from(genreSet)
})

// 장르 ID를 이름으로 변환하는 매핑 (간단한 버전)
const genreNames: Record<number, string> = {
  28: '액션', 12: '모험', 16: '애니메이션', 35: '코미디', 80: '범죄',
  99: '다큐멘터리', 18: '드라마', 10751: '가족', 14: '판타지', 36: '역사',
  27: '공포', 10402: '음악', 9648: '미스터리', 10749: '로맨스', 878: 'SF',
  10770: 'TV 영화', 53: '스릴러', 10752: '전쟁', 37: '서부'
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

// 찜 목록이 변경될 때마다 추천 영화 로드
watch(wishlist, (newWishlist) => {
  if (newWishlist.length > 0) {
    getRecommendationsFromWishlist(newWishlist)
  }
}, { immediate: true })
</script>

<template>
  <div>
    <AppHeader />

    <main class="page-container">
      <div class="container">
        <div class="section-header">
          <h1 class="section-title">
            <i class="fas fa-heart" style="color: var(--primary-color)"></i>
            내가 찜한 리스트
          </h1>
          <span v-if="hasMovies" class="text-secondary">총 {{ wishlist.length }}개의 영화</span>
        </div>

        <!-- 통계 대시보드 -->
        <div v-if="hasMovies && stats" class="stats-dashboard">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-film"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalMovies }}</div>
              <div class="stat-label">찜한 영화</div>
              <div class="stat-detail">약 {{ stats.estimatedHours }}시간 분량</div>
            </div>
          </div>

          <div v-if="stats.favoriteGenre" class="stat-card stat-card-highlight">
            <div class="stat-icon">
              <i class="fas fa-heart"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value-small">{{ stats.favoriteGenre.name }}</div>
              <div class="stat-label">가장 좋아하는 장르</div>
              <div class="stat-detail">{{ stats.favoriteGenre.count }}개 ({{ stats.favoriteGenre.percentage }}%)</div>
            </div>
          </div>

          <div v-if="stats.favoriteDecade" class="stat-card stat-card-highlight">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value-small">{{ stats.favoriteDecade.decade }}</div>
              <div class="stat-label">선호하는 시대</div>
              <div class="stat-detail">{{ stats.favoriteDecade.count }}개 ({{ stats.favoriteDecade.percentage }}%)</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-globe-asia"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value-small">
                {{ stats.isKoreanPreferred ? '한국' : '글로벌' }}
              </div>
              <div class="stat-label">영화 취향</div>
              <div class="stat-detail">
                한국 {{ stats.koreanMovies }}개 ({{ stats.koreanPercentage }}%) • 외국 {{ stats.globalMovies }}개
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasMovies">
          <!-- 필터 및 정렬 -->
          <div class="controls-section">
            <div class="filter-controls">
              <div class="filter-group-inline">
                <label class="filter-label-inline" for="genre-filter">
                  <i class="fas fa-filter"></i> 장르
                </label>
                <select id="genre-filter" class="filter-select-inline" v-model="filterGenre">
                  <option value="">전체</option>
                  <option v-for="genreId in availableGenres" :key="genreId" :value="genreId">
                    {{ genreNames[genreId] || `장르 ${genreId}` }}
                  </option>
                </select>
              </div>

              <div class="filter-group-inline">
                <label class="filter-label-inline" for="sort-select">
                  <i class="fas fa-sort"></i> 정렬
                </label>
                <select id="sort-select" class="filter-select-inline" v-model="sortBy">
                  <option value="date_added">추가된 순서</option>
                  <option value="rating_desc">평점 높은 순</option>
                  <option value="rating_asc">평점 낮은 순</option>
                  <option value="title_asc">제목 가나다순</option>
                  <option value="release_date_desc">최신 개봉순</option>
                  <option value="release_date_asc">오래된 개봉순</option>
                </select>
              </div>
            </div>
          </div>

          <div class="results-info">
            <span class="text-secondary">
              {{ filteredAndSortedMovies.length }}개의 영화
              <span v-if="filterGenre"> • {{ genreNames[Number(filterGenre)] }} 필터 적용됨</span>
            </span>
          </div>

          <div class="movie-grid">
            <MovieCard
              v-for="movie in filteredAndSortedMovies"
              :key="movie.id"
              :movie="movie"
              @click="handleMovieClick"
            />
          </div>

          <!-- 추천 섹션 -->
          <section v-if="hasRecommendations || recommendationsLoading" class="recommendations-section">
            <div class="section-header">
              <h2 class="section-title">
                내 취향 저격 영화
              </h2>
              <p class="text-secondary">찜한 영화를 바탕으로 추천해드려요</p>
            </div>

            <LoadingSpinner v-if="recommendationsLoading" text="추천 영화를 찾고 있습니다..." />

            <Swiper
              v-else-if="hasRecommendations"
              :modules="modules"
              :slides-per-view="2.7"
              :space-between="15"
              :navigation="true"
              :loop="true"
              :autoplay="{ delay: 4000, disableOnInteraction: false }"
              :breakpoints="{
                320: { slidesPerView: 2, spaceBetween: 10 },
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 }
              }"
              class="recommendations-slider"
            >
              <SwiperSlide v-for="movie in recommendations" :key="movie.id">
                <MovieCard :movie="movie" @click="handleMovieClick" />
              </SwiperSlide>
            </Swiper>
          </section>
        </div>

        <div v-else class="empty-state">
          <i class="fas fa-heart-broken empty-state-icon"></i>
          <h2 class="empty-state-title">찜한 영화가 없습니다</h2>
          <p class="empty-state-description">
            마음에 드는 영화를 찜해보세요!<br />
            영화 카드의 하트 아이콘을 클릭하면 이 목록에 추가됩니다.
          </p>
          <RouterLink to="/" class="btn btn-primary mt-4">
            <i class="fas fa-film"></i> 영화 둘러보기
          </RouterLink>
        </div>
      </div>
    </main>

    <AppFooter />

    <MovieDetailModal :movie="selectedMovie" :show="showModal" @close="handleCloseModal" />
  </div>
</template>

<style scoped>
.text-secondary {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.section-header h1.section-title {
  margin-bottom: 0.25rem;
}

/* 통계 대시보드 */
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
  padding: 2rem 0;
}

.stat-card {
  background: var(--bg-light);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(229, 9, 20, 0.2);
  border-color: var(--primary-color);
}

.stat-card-highlight {
  background: linear-gradient(135deg, rgba(229, 9, 20, 0.05), rgba(229, 9, 20, 0.1));
  border-color: rgba(229, 9, 20, 0.3);
}

.stat-card-highlight:hover {
  background: linear-gradient(135deg, rgba(229, 9, 20, 0.1), rgba(229, 9, 20, 0.15));
  border-color: var(--primary-color);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--primary-color), #b20710);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: white;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-value-small {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-detail {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 컨트롤 섹션 */
.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 1rem;
  padding: 1rem;
  background: var(--bg-light);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  flex: 1;
}

.filter-group-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label-inline {
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  font-weight: 500;
}

.filter-select-inline {
  padding: 0.5rem 1rem;
  background: var(--bg-dark);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
}

.filter-select-inline:hover,
.filter-select-inline:focus {
  border-color: var(--primary-color);
  outline: none;
}

.action-controls {
  display: flex;
  gap: 0.75rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.results-info {
  margin-bottom: 1.5rem;
}

.recommendations-section {
  margin-top: 4rem;
  padding-top: 3rem;
  border-top: 1px solid var(--border-color);
}

.recommendations-section .section-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  margin-bottom: 0.125rem; /* Restored reasonable space below title */
}

.recommendations-section .section-header h2.section-title {
  margin-bottom: 0;
}

.recommendations-slider {
  padding: 0.5rem 0 1.5rem; /* Restored reasonable space above slider */
}

@media (max-width: 768px) {
  .stats-dashboard {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin: 1.5rem 0;
    padding: 1.5rem 0;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-value-small {
    font-size: 1rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .stat-detail {
    font-size: 0.75rem;
  }

  .controls-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-controls {
    flex-direction: column;
    width: 100%;
  }

  .filter-group-inline {
    width: 100%;
  }

  .filter-select-inline {
    flex: 1;
    width: 100%;
  }

  .action-controls {
    width: 100%;
  }

  .action-controls button {
    width: 100%;
  }

  .recommendations-section {
    margin-top: 3rem;
    padding-top: 2rem;
  }

  .recommendations-section .section-title {
    font-size: 1.4rem;
  }
}

@media (max-width: 480px) {
  .stats-dashboard {
    grid-template-columns: 1fr;
  }

  .recommendations-section .section-title {
    font-size: 1.2rem;
  }
}
</style>
