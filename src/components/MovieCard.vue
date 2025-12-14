<script setup lang="ts">
import { computed } from 'vue'
import type { Movie } from '@/types/movie'
import { getPosterUrl } from '@/utils/tmdb'
import { useWishlist } from '@/composables/useWishlist'

interface Props {
  movie: Movie
}

interface Emits {
  (e: 'click', movie: Movie): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { toggleWishlist, isInWishlist } = useWishlist()

const posterUrl = computed(() => getPosterUrl(props.movie.poster_path))
const rating = computed(() => props.movie.vote_average.toFixed(1))
const releaseYear = computed(() => props.movie.release_date?.split('-')[0] || 'N/A')
const isWishlisted = computed(() => isInWishlist(props.movie.id))

const handleWishlistToggle = (e: Event) => {
  e.stopPropagation()
  toggleWishlist(props.movie)
}

const handleCardClick = () => {
  emit('click', props.movie)
}
</script>

<template>
  <div class="movie-card" @click="handleCardClick">
    <img :src="posterUrl" :alt="movie.title" class="movie-card-poster" loading="lazy" />

    <button
      class="movie-card-wishlist"
      :class="{ active: isWishlisted }"
      @click="handleWishlistToggle"
      :aria-label="isWishlisted ? '찜 취소' : '찜하기'"
    >
      <i :class="isWishlisted ? 'fas fa-heart' : 'far fa-heart'"></i>
    </button>

    <div class="movie-card-overlay">
      <div class="movie-card-click-hint">
        <i class="fas fa-info-circle"></i> 자세히 보기
      </div>

      <div class="movie-card-content">
        <h3 class="movie-card-title">{{ movie.title }}</h3>
        <div class="movie-card-info">
          <span class="movie-card-rating">
            <i class="fas fa-star" style="color: #ffd700"></i>
            {{ rating }}
          </span>
          <span>{{ releaseYear }}</span>
        </div>
        <p class="movie-card-overview">
          {{ movie.overview || '설명이 없습니다.' }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.movie-card-overview {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.movie-card-click-hint {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: white;
  background-color: var(--primary-color);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
  backdrop-filter: blur(5px);
  opacity: 0;
  transform: translateY(-5px);
  transition: all var(--transition-speed) var(--transition-ease);
}

.movie-card:hover .movie-card-click-hint {
  opacity: 1;
  transform: translateY(0);
}

.movie-card-click-hint i {
  font-size: 0.9rem;
}

.movie-card-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
}

@media (max-width: 480px) {
  .movie-card-click-hint {
    font-size: 0.7rem; /* Reduced font size */
    padding: 0.3rem 0.5rem; /* Reduced padding */
    gap: 0.3rem; /* Reduced gap */
  }

  .movie-card-click-hint i {
    font-size: 0.75rem; /* Reduced icon size */
  }

  .movie-card-overview {
    font-size: 0.75rem; /* Further reduced font size */
    -webkit-line-clamp: 2; /* Reduce to 2 lines for tighter space */
  }

  .movie-card-wishlist {
    width: 30px; /* Reduced width */
    height: 30px; /* Reduced height */
    top: 0.5rem; /* Adjusted position */
    right: 0.5rem; /* Adjusted position */
  }

  .movie-card-wishlist i {
    font-size: 0.8rem; /* Reduced icon size */
  }
}
</style>
