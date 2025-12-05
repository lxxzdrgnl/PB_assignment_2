<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import type { Movie } from '@/types/movie'
import { getPosterUrl, getBackdropUrl, getMovieDetails } from '@/utils/tmdb'
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
    movieDetails.value = await getMovieDetails(props.movie.id)
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

watch(() => props.show, (newVal) => {
  if (newVal && props.movie) {
    loadMovieDetails()
  } else {
    movieDetails.value = null
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

            <div v-if="genres.length > 0" class="modal-section">
              <h3 class="modal-section-title">장르</h3>
              <div class="modal-genres">
                <span v-for="genre in genres" :key="genre.id" class="modal-genre-tag">
                  {{ genre.name }}
                </span>
              </div>
            </div>

            <div v-if="cast.length > 0" class="modal-section">
              <h3 class="modal-section-title">출연진</h3>
              <div class="modal-cast-list">
                <div v-for="person in cast" :key="person.id" class="modal-cast-item">
                  <span class="modal-cast-name">{{ person.name }}</span>
                  <span class="modal-cast-character">{{ person.character }}</span>
                </div>
              </div>
            </div>

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
  background-color: var(--bg-dark);
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
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
    var(--bg-dark) 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.7) 100%
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
