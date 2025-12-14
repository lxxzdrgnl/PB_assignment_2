<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LargeMovieCard from '@/components/LargeMovieCard.vue'
import MovieCardSkeleton from '@/components/MovieCardSkeleton.vue'
import type { Movie } from '@/types/movie'
import { getPopularMovies } from '@/utils/tmdb'

const emit = defineEmits<{
  (e: 'movieClick', movie: Movie): void
}>()

const movies = ref<Movie[]>([])
const loading = ref(false)
const currentPage = ref(2)
const totalPages = ref(1)

const loadMovies = async (page: number) => {
  try {
    loading.value = true
    const response = await getPopularMovies(page)
    movies.value = response.results
    currentPage.value = page
    totalPages.value = response.total_pages
  } catch (err) {
    console.error('영화 데이터 로드 실패:', err)
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  if (page >= 2 && page <= totalPages.value) {
    loadMovies(page)
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

const handleMovieClick = (movie: Movie) => {
  emit('movieClick', movie)
}

onMounted(() => {
  loadMovies(2)
})
</script>

<template>
  <div>
    <!-- Loading Skeleton -->
    <Transition name="page-fade" mode="out-in">
      <div v-if="loading" key="loading" class="table-view-grid">
        <MovieCardSkeleton v-for="i in 20" :key="'skeleton-' + i" />
      </div>

      <!-- Movies Grid -->
      <div v-else :key="currentPage" class="table-view-grid">
        <LargeMovieCard
          v-for="movie in movies"
          :key="movie.id"
          :movie="movie"
          @click="handleMovieClick"
        />
      </div>
    </Transition>

    <!-- Pagination -->
    <div v-if="!loading" class="pagination">
      <button class="pagination-btn" :disabled="currentPage === 2" @click="prevPage">
        <i class="fas fa-chevron-left"></i>
        이전
      </button>

      <div class="pagination-info">페이지 {{ currentPage }} / {{ totalPages }}</div>

      <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="nextPage"
      >
        다음
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Page Fade Transition */
.page-fade-enter-active {
  transition: all 0.3s ease-out;
}

.page-fade-leave-active {
  transition: all 0.2s ease-in;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.table-view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 2rem 0;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--bg-light);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

@media (max-width: 1024px) {
  .table-view-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .section-title {
    font-size: 1.5rem;
  }

  .table-view-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  .pagination {
    gap: 1rem;
  }

  .pagination-btn {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }

  .pagination-info {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.25rem;
  }

  .table-view-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .pagination {
    gap: 0.5rem;
  }

  .pagination-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }

  .pagination-btn i {
    font-size: 0.85rem;
  }

  .pagination-info {
    font-size: 0.85rem;
  }
}
</style>
