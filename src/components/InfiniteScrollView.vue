<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import LargeMovieCard from '@/components/LargeMovieCard.vue'
import MovieCardSkeleton from '@/components/MovieCardSkeleton.vue'
import type { Movie } from '@/types/movie'
import { getPopularMovies } from '@/utils/tmdb'

const emit = defineEmits<{
  (e: 'movieClick', movie: Movie): void
}>()

const movies = ref<Movie[]>([])
const loading = ref(false)
const isLoadingMore = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)

const loadMovies = async (page: number, append: boolean = false) => {
  try {
    if (append) {
      isLoadingMore.value = true
    } else {
      loading.value = true
    }

    // Load 30 movies by combining results from two API pages
    // Display page 2 -> API pages 2,3
    // Display page 3 -> API pages 4,5
    const apiPage1 = (page - 2) * 2 + 2
    const apiPage2 = apiPage1 + 1

    const [response1, response2] = await Promise.all([
      getPopularMovies(apiPage1),
      getPopularMovies(apiPage2)
    ])

    // Combine and take first 30 movies
    const allMovies = [...response1.results, ...response2.results]
    const newMovies = allMovies.slice(0, 30)

    if (append) {
      movies.value = [...movies.value, ...newMovies]
    } else {
      movies.value = newMovies
    }

    currentPage.value = page
    totalPages.value = Math.ceil(response1.total_results / 30)
  } catch (err) {
    console.error('영화 데이터 로드 실패:', err)
  } finally {
    loading.value = false
    isLoadingMore.value = false
  }
}

const handleScroll = () => {
  if (!loading.value && !isLoadingMore.value) {
    const scrollBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500

    if (scrollBottom && currentPage.value < totalPages.value) {
      loadMovies(currentPage.value + 1, true)
    }
  }
}

const handleMovieClick = (movie: Movie) => {
  emit('movieClick', movie)
}

onMounted(() => {
  loadMovies(2)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div>
    <Transition name="fade" mode="out-in">
      <!-- Initial Loading Skeleton -->
      <div v-if="loading" key="loading" class="movie-grid">
        <MovieCardSkeleton v-for="i in 30" :key="'skeleton-' + i" />
      </div>

      <!-- Movies Grid -->
      <div v-else key="movies">
        <div class="movie-grid">
          <LargeMovieCard v-for="movie in movies" :key="movie.id" :movie="movie" @click="handleMovieClick" />
        </div>

        <!-- Loading More Skeleton -->
        <div v-if="isLoadingMore" class="loading-more">
          <MovieCardSkeleton v-for="i in 6" :key="'skeleton-' + i" />
        </div>

        <!-- Load More Info -->
        <div v-if="!isLoadingMore && currentPage < totalPages" class="load-more-info">
          <p>
            <i class="fas fa-arrow-down"></i>
            아래로 스크롤하면 더 많은 영화를 볼 수 있습니다
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Fade Transition */
.fade-enter-active {
  transition: all 0.3s ease-out;
}

.fade-leave-active {
  transition: all 0.2s ease-in;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.loading-more {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.load-more-info {
  text-align: center;
  padding: 2rem 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.load-more-info i {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}

@media (max-width: 1024px) {
  .movie-grid,
  .loading-more {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .section-title {
    font-size: 1.5rem;
  }

  .movie-grid,
  .loading-more {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.25rem;
  }

  .movie-grid,
  .loading-more {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
}
</style>
