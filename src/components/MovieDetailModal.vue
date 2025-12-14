<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import type { Movie } from '@/types/movie'
import { getPosterUrl, getBackdropUrl, getMovieDetails, getWatchProviders } from '@/utils/tmdb'
import { useWishlist } from '@/composables/useWishlist'

interface Props {
  movie: Movie | null
  show: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const movieDetails = ref<any>(null)
const loadingDetails = ref(false)
const watchProviders = ref<any>(null)

const { toggleWishlist, isInWishlist } = useWishlist()

const backdropUrl = computed(() =>
  props.movie ? getBackdropUrl(props.movie.backdrop_path) : ''
)
const posterUrl = computed(() =>
  props.movie ? getPosterUrl(props.movie.poster_path) : ''
)
const rating = computed(() =>
  props.movie ? props.movie.vote_average.toFixed(1) : '0.0'
)
const releaseYear = computed(() =>
  props.movie?.release_date?.split('-')[0] || 'N/A'
)
const isWishlisted = computed(() =>
  props.movie ? isInWishlist(props.movie.id) : false
)

const handleClose = () => {
  emit('close')
}

const handleWishlistToggle = () => {
  if (props.movie) {
    toggleWishlist(props.movie)
  }
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

const loadMovieDetails = async () => {
  if (!props.movie) return

  loadingDetails.value = true
  try {
    const [details, providers] = await Promise.all([
      getMovieDetails(props.movie.id),
      getWatchProviders(props.movie.id)
    ])
    movieDetails.value = details
    watchProviders.value = providers
  } catch (error) {
    console.error('상세 정보 로드 실패:', error)
  } finally {
    loadingDetails.value = false
  }
}

const cast = computed(() => {
  return movieDetails.value?.credits?.cast?.slice(0, 5) || []
})

const director = computed(() => {
  const crew = movieDetails.value?.credits?.crew || []
  return crew.find((person: any) => person.job === 'Director')
})

const genres = computed(() => {
  return movieDetails.value?.genres || []
})

const runtime = computed(() => {
  const minutes = movieDetails.value?.runtime || 0
  if (minutes === 0) return 'N/A'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`
})

const budget = computed(() => {
  const amount = movieDetails.value?.budget || 0
  if (amount === 0) return 'N/A'
  return `$${(amount / 1000000).toFixed(1)}M`
})

const revenue = computed(() => {
  const amount = movieDetails.value?.revenue || 0
  if (amount === 0) return 'N/A'
  return `$${(amount / 1000000).toFixed(1)}M`
})

const trailers = computed(() => {
  const videos = movieDetails.value?.videos?.results || []
  // YouTube 예고편 우선, 그 다음 티저, 클립 순으로 필터링
  return videos
    .filter((video: any) => video.site === 'YouTube')
    .sort((a: any, b: any) => {
      const typeOrder = { Trailer: 1, Teaser: 2, Clip: 3 }
      return (typeOrder[a.type as keyof typeof typeOrder] || 4) - (typeOrder[b.type as keyof typeof typeOrder] || 4)
    })
})

const krProviders = computed(() => {
  const results = watchProviders.value?.results?.KR
  if (!results) return null

  return {
    flatrate: results.flatrate || [], // 스트리밍
    rent: results.rent || [], // 대여
    buy: results.buy || [], // 구매
    link: results.link || ''
  }
})

watch(() => props.show, (newVal) => {
  if (newVal && props.movie) {
    loadMovieDetails()
  } else {
    movieDetails.value = null
    watchProviders.value = null
  }
})
</script>

<template>
  <Transition name="modal">
    <div v-if="show && movie" class="modal-backdrop" @click="handleBackdropClick">
      <div class="modal-container">
        <button class="modal-close-btn" @click="handleClose" aria-label="닫기">
          <i class="fas fa-times"></i>
        </button>

        <div class="modal-header">
          <img :src="backdropUrl" :alt="movie.title" class="modal-backdrop-image" />
          <div class="modal-header-overlay"></div>
          <div class="modal-header-content">
            <h2 class="modal-title">{{ movie.title }}</h2>
            <div class="modal-meta">
              <span class="modal-rating">
                <i class="fas fa-star"></i>
                {{ rating }}
              </span>
              <span class="modal-year">{{ releaseYear }}</span>
              <span v-if="movie.vote_count" class="modal-votes">
                {{ movie.vote_count.toLocaleString() }} votes
              </span>
            </div>
          </div>
        </div>

        <div class="modal-body">
          <div class="modal-poster-section">
            <img :src="posterUrl" :alt="movie.title" class="modal-poster" />
            <button
              class="modal-wishlist-btn btn"
              :class="{ 'btn-primary': isWishlisted, 'btn-secondary': !isWishlisted }"
              @click="handleWishlistToggle"
            >
              <i :class="isWishlisted ? 'fas fa-heart' : 'far fa-heart'"></i>
              {{ isWishlisted ? '찜 취소' : '내가 찜한 콘텐츠' }}
            </button>
          </div>

          <div class="modal-info-section">
            <div class="modal-section">
              <h3 class="modal-section-title">줄거리</h3>
              <p class="modal-overview">
                {{ movie.overview || '줄거리 정보가 없습니다.' }}
              </p>
            </div>

            <!-- 예고편 섹션 -->
            <div v-if="loadingDetails" class="modal-section">
              <h3 class="modal-section-title">예고편 & 영상</h3>
              <div class="modal-trailers">
                <div v-for="i in 2" :key="i" class="modal-trailer-item">
                  <div class="skeleton skeleton-trailer"></div>
                  <div class="modal-trailer-info">
                    <div class="skeleton skeleton-text" style="width: 80px; height: 20px;"></div>
                    <div class="skeleton skeleton-text" style="width: 200px; height: 16px; margin-top: 0.5rem;"></div>
                  </div>
                </div>
              </div>
            </div>
            <Transition name="fade" mode="out-in">
              <div v-if="!loadingDetails && trailers.length > 0" class="modal-section">
                <h3 class="modal-section-title">예고편 & 영상</h3>
                <div class="modal-trailers">
                  <div v-for="(video, index) in trailers.slice(0, 3)" :key="video.key" class="modal-trailer-item">
                    <div class="modal-trailer-wrapper">
                      <iframe
                        :src="`https://www.youtube.com/embed/${video.key}`"
                        :title="video.name"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        class="modal-trailer-iframe"
                      ></iframe>
                    </div>
                    <div class="modal-trailer-info">
                      <span class="modal-trailer-type">{{ video.type }}</span>
                      <span class="modal-trailer-name">{{ video.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- 시청 가능 플랫폼 섹션 -->
            <div v-if="loadingDetails" class="modal-section">
              <h3 class="modal-section-title">시청 가능 플랫폼</h3>
              <div class="modal-providers">
                <div class="modal-provider-group">
                  <div class="skeleton skeleton-text" style="width: 80px; height: 20px; margin-bottom: 0.75rem;"></div>
                  <div class="modal-provider-list">
                    <div v-for="i in 3" :key="i" class="skeleton skeleton-provider"></div>
                  </div>
                </div>
              </div>
            </div>
            <Transition name="fade" mode="out-in">
              <div v-if="!loadingDetails && krProviders" class="modal-section">
                <h3 class="modal-section-title">시청 가능 플랫폼</h3>
                <div class="modal-providers">
                  <div v-if="krProviders.flatrate.length > 0" class="modal-provider-group">
                    <h4 class="modal-provider-label">스트리밍</h4>
                    <div class="modal-provider-list">
                      <div v-for="provider in krProviders.flatrate" :key="provider.provider_id" class="modal-provider-item">
                        <img
                          :src="`https://image.tmdb.org/t/p/original${provider.logo_path}`"
                          :alt="provider.provider_name"
                          :title="provider.provider_name"
                          class="modal-provider-logo"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="krProviders.rent.length > 0" class="modal-provider-group">
                    <h4 class="modal-provider-label">대여</h4>
                    <div class="modal-provider-list">
                      <div v-for="provider in krProviders.rent" :key="provider.provider_id" class="modal-provider-item">
                        <img
                          :src="`https://image.tmdb.org/t/p/original${provider.logo_path}`"
                          :alt="provider.provider_name"
                          :title="provider.provider_name"
                          class="modal-provider-logo"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="krProviders.buy.length > 0" class="modal-provider-group">
                    <h4 class="modal-provider-label">구매</h4>
                    <div class="modal-provider-list">
                      <div v-for="provider in krProviders.buy" :key="provider.provider_id" class="modal-provider-item">
                        <img
                          :src="`https://image.tmdb.org/t/p/original${provider.logo_path}`"
                          :alt="provider.provider_name"
                          :title="provider.provider_name"
                          class="modal-provider-logo"
                        />
                      </div>
                    </div>
                  </div>

                  <p v-if="krProviders.link" class="modal-provider-note">
                    <a :href="krProviders.link" target="_blank" rel="noopener noreferrer" class="modal-provider-link">
                      <i class="fas fa-external-link-alt"></i>
                      자세한 정보 보기
                    </a>
                  </p>
                </div>
              </div>
            </Transition>

            <!-- 장르 섹션 -->
            <div v-if="loadingDetails" class="modal-section">
              <h3 class="modal-section-title">장르</h3>
              <div class="modal-genres">
                <div v-for="i in 3" :key="i" class="skeleton skeleton-genre"></div>
              </div>
            </div>
            <Transition name="fade" mode="out-in">
              <div v-if="!loadingDetails && genres.length > 0" class="modal-section">
                <h3 class="modal-section-title">장르</h3>
                <div class="modal-genres">
                  <span v-for="genre in genres" :key="genre.id" class="modal-genre-tag">
                    {{ genre.name }}
                  </span>
                </div>
              </div>
            </Transition>

            <!-- 출연진 섹션 -->
            <div v-if="loadingDetails" class="modal-section">
              <h3 class="modal-section-title">출연진</h3>
              <div class="modal-cast-list">
                <div v-for="i in 5" :key="i" class="modal-cast-item">
                  <div class="skeleton skeleton-text" style="width: 120px; height: 18px;"></div>
                  <div class="skeleton skeleton-text" style="width: 160px; height: 16px; margin-top: 0.25rem;"></div>
                </div>
              </div>
            </div>
            <Transition name="fade" mode="out-in">
              <div v-if="!loadingDetails && cast.length > 0" class="modal-section">
                <h3 class="modal-section-title">출연진</h3>
                <div class="modal-cast-list">
                  <div v-for="person in cast" :key="person.id" class="modal-cast-item">
                    <span class="modal-cast-name">{{ person.name }}</span>
                    <span class="modal-cast-character">{{ person.character }}</span>
                  </div>
                </div>
              </div>
            </Transition>

            <div class="modal-section">
              <h3 class="modal-section-title">상세 정보</h3>
              <div class="modal-details">
                <div v-if="director" class="modal-detail-item">
                  <span class="modal-detail-label">감독:</span>
                  <span class="modal-detail-value">{{ director.name }}</span>
                </div>
                <div class="modal-detail-item">
                  <span class="modal-detail-label">개봉일:</span>
                  <span class="modal-detail-value">{{ movie.release_date || 'N/A' }}</span>
                </div>
                <div class="modal-detail-item">
                  <span class="modal-detail-label">상영시간:</span>
                  <span class="modal-detail-value">{{ runtime }}</span>
                </div>
                <div class="modal-detail-item">
                  <span class="modal-detail-label">원제:</span>
                  <span class="modal-detail-value">{{ movie.original_title || movie.title }}</span>
                </div>
                <div class="modal-detail-item">
                  <span class="modal-detail-label">언어:</span>
                  <span class="modal-detail-value">{{ movie.original_language?.toUpperCase() || 'N/A' }}</span>
                </div>
                <div v-if="budget !== 'N/A'" class="modal-detail-item">
                  <span class="modal-detail-label">제작비:</span>
                  <span class="modal-detail-value">{{ budget }}</span>
                </div>
                <div v-if="revenue !== 'N/A'" class="modal-detail-item">
                  <span class="modal-detail-label">수익:</span>
                  <span class="modal-detail-value">{{ revenue }}</span>
                </div>
                <div class="modal-detail-item">
                  <span class="modal-detail-label">평점:</span>
                  <span class="modal-detail-value">
                    ⭐ {{ movie.vote_average.toFixed(1) }} / 10
                  </span>
                </div>
                <div class="modal-detail-item">
                  <span class="modal-detail-label">투표 수:</span>
                  <span class="modal-detail-value">{{ movie.vote_count?.toLocaleString() || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  overflow-y: auto;
}

.modal-container {
  background-color: #141414;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
}

[data-theme='light'] .modal-container {
  background-color: #ffffff;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);

  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.modal-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.modal-close-btn {
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(20, 20, 20, 0.9);
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all var(--transition-speed) var(--transition-ease);
}

.modal-close-btn:hover {
  background-color: var(--primary-color);
  transform: scale(1.1);
}

.modal-header {
  position: relative;
  height: 400px;
  overflow: hidden;
}

.modal-backdrop-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    0deg,
    #141414 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
}

[data-theme='light'] .modal-header-overlay {
  background: linear-gradient(
    0deg,
    #f5f5f5 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.5) 100%
  );
}

.modal-header-content {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  right: 2rem;
}

.modal-title {
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.8);
}

.modal-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 1rem;
}

.modal-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #ffd700;
  font-weight: 600;
}

.modal-year {
  color: var(--text-secondary);
}

.modal-votes {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.modal-body {
  padding: 2rem;
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
}

.modal-poster-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-poster {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.modal-wishlist-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  font-size: 0.9rem;
}

.modal-info-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.modal-section-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.modal-overview {
  line-height: 1.8;
  color: var(--text-secondary);
  font-size: 1rem;
}

.modal-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-detail-item {
  display: flex;
  gap: 0.5rem;
}

.modal-detail-label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 80px;
}

.modal-detail-value {
  color: var(--text-primary);
}

.modal-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.modal-genre-tag {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: var(--bg-light);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--text-primary);
  transition: all var(--transition-speed) var(--transition-ease);
}

.modal-genre-tag:hover {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.modal-cast-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-cast-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background-color: var(--bg-light);
  border-radius: 6px;
  transition: all var(--transition-speed) var(--transition-ease);
}

.modal-cast-item:hover {
  background-color: var(--border-color);
  transform: translateX(5px);
}

.modal-cast-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.modal-cast-character {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.modal-trailers {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-trailer-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-trailer-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  background-color: var(--bg-light);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.modal-trailer-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.modal-trailer-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.modal-trailer-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--primary-color);
  color: var(--text-primary);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  width: fit-content;
}

.modal-trailer-name {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}

.modal-providers {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-provider-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-provider-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.modal-provider-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.modal-provider-item {
  position: relative;
  transition: transform var(--transition-speed) var(--transition-ease);
}

.modal-provider-item:hover {
  transform: scale(1.1);
}

.modal-provider-logo {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 2px solid var(--border-color);
  transition: all var(--transition-speed) var(--transition-ease);
}

.modal-provider-logo:hover {
  border-color: var(--primary-color);
  box-shadow: 0 6px 16px rgba(229, 9, 20, 0.4);
}

.modal-provider-note {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.modal-provider-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  text-decoration: none;
  transition: color var(--transition-speed) var(--transition-ease);
}

.modal-provider-link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.modal-provider-link i {
  font-size: 0.75rem;
}

/* Skeleton Styles */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-light) 0%,
    var(--border-color) 50%,
    var(--bg-light) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text {
  height: 20px;
  border-radius: 4px;
}

.skeleton-provider {
  width: 60px;
  height: 60px;
  border-radius: 12px;
}

.skeleton-trailer {
  width: 100%;
  padding-bottom: 56.25%;
  position: relative;
  border-radius: 8px;
}

.skeleton-genre {
  width: 80px;
  height: 36px;
  border-radius: 20px;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Modal Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-speed) var(--transition-ease);
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform var(--transition-speed) var(--transition-ease);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.9) translateY(20px);
}

.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(-20px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-backdrop {
    padding: 0;
    align-items: flex-start;
  }

  .modal-container {
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-close-btn {
    position: fixed;
    top: 1rem;
    right: 1rem;
  }

  .modal-header {
    height: 300px;
  }

  .modal-title {
    font-size: 1.75rem;
  }

  .modal-header-content {
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
  }

  .modal-body {
    grid-template-columns: 1fr;
    padding: 1.5rem;
  }

  .modal-poster-section {
    flex-direction: row;
    align-items: flex-start;
  }

  .modal-poster {
    width: 120px;
    flex-shrink: 0;
  }

  .modal-wishlist-btn {
    flex: 1;
  }

  .modal-trailers {
    gap: 1.25rem;
  }

  .modal-trailer-wrapper {
    border-radius: 6px;
  }
}

@media (max-width: 480px) {
  .modal-header {
    height: 250px;
  }

  .modal-title {
    font-size: 1.5rem;
  }

  .modal-meta {
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.9rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-poster-section {
    flex-direction: column;
  }

  .modal-poster {
    width: 100%;
  }
}
</style>
