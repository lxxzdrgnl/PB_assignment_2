<template>
  <div class="app">
    <!-- 헤더: 사용자 정보 & 설정 -->
    <header>
      <div v-if="isAuthenticated">
        <span>환영합니다, {{ user }}님</span>
        <button @click="handleLogout">로그아웃</button>
      </div>

      <!-- 테마 변경 -->
      <select :value="preferences.theme" @change="handleThemeChange">
        <option value="light">라이트</option>
        <option value="dark">다크</option>
        <option value="system">시스템</option>
      </select>

      <!-- 위시리스트 개수 -->
      <div>
        <span>위시리스트: {{ wishlistCount }}</span>
      </div>
    </header>

    <!-- 검색 섹션 -->
    <section class="search">
      <input
        v-model="searchQuery"
        @keyup.enter="handleSearch"
        placeholder="영화 검색..."
      />

      <!-- 최근 검색어 -->
      <div v-if="recentSearches.length > 0" class="recent-searches">
        <h3>최근 검색어</h3>
        <ul>
          <li v-for="item in recentSearches" :key="item.query">
            <button @click="searchQuery = item.query; handleSearch()">
              {{ item.query }}
            </button>
            <button @click="removeSearchQuery(item.query)">✕</button>
          </li>
        </ul>
        <button @click="clearSearchHistory">전체 삭제</button>
      </div>
    </section>

    <!-- 영화 목록 -->
    <section class="movies">
      <h2>인기 영화</h2>
      <div v-if="loading">로딩 중...</div>
      <div v-else class="movie-grid">
        <div v-for="movie in movies" :key="movie.id" class="movie-card">
          <img :src="getImageUrl(movie.poster_path)" :alt="movie.title" />
          <h3>{{ movie.title }}</h3>
          <p>평점: {{ movie.vote_average }}/10</p>

          <!-- 위시리스트 버튼 -->
          <button
            @click="toggleWishlist(movie)"
            :class="{ active: isInWishlist(movie.id) }"
          >
            {{ isInWishlist(movie.id) ? '❤️' : '🤍' }}
          </button>

          <!-- 시청 기록 -->
          <div v-if="isInWatchHistory(movie.id)">
            <p>시청 중: {{ getMovieWatchHistory(movie.id).watchProgress }}%</p>
          </div>

          <!-- 영화 보기 버튼 -->
          <button @click="watchMovie(movie)">영화 보기</button>
        </div>
      </div>
    </section>

    <!-- 위시리스트 섹션 -->
    <section class="wishlist">
      <h2>내 위시리스트</h2>
      <div v-if="wishlist.length === 0">
        <p>위시리스트가 비어있습니다.</p>
      </div>
      <div v-else class="movie-grid">
        <div v-for="movie in wishlist" :key="movie.id" class="movie-card">
          <img :src="getImageUrl(movie.poster_path)" :alt="movie.title" />
          <h3>{{ movie.title }}</h3>
          <button @click="removeFromWishlist(movie.id)">삭제</button>
        </div>
      </div>
    </section>

    <!-- 시청 중인 영화 -->
    <section class="continue-watching">
      <h2>계속 시청하기</h2>
      <div v-if="inProgressMovies.length === 0">
        <p>시청 중인 영화가 없습니다.</p>
      </div>
      <div v-else class="movie-grid">
        <div v-for="item in inProgressMovies" :key="item.movie.id" class="movie-card">
          <img :src="getImageUrl(item.movie.poster_path)" :alt="item.movie.title" />
          <h3>{{ item.movie.title }}</h3>
          <progress :value="item.watchProgress" max="100"></progress>
          <p>{{ Math.round(item.watchProgress) }}% 시청</p>
          <button @click="continueWatching(item)">이어서 보기</button>
        </div>
      </div>
    </section>

    <!-- 시청 통계 -->
    <section class="stats">
      <h2>시청 통계</h2>
      <div class="stats-grid">
        <div>
          <h3>{{ watchStats.totalMovies }}</h3>
          <p>총 시청 영화</p>
        </div>
        <div>
          <h3>{{ watchStats.completedMovies }}</h3>
          <p>완료한 영화</p>
        </div>
        <div>
          <h3>{{ watchStats.totalWatchTime }}분</h3>
          <p>총 시청 시간</p>
        </div>
      </div>
    </section>

    <!-- 캐시 정보 (개발용) -->
    <section v-if="isDevelopment" class="cache-info">
      <h2>캐시 정보</h2>
      <p>캐시 크기: {{ cacheStats.size }}</p>
      <p>캐시 항목 수: {{ cacheStats.itemCount }}</p>
      <button @click="clearCache">캐시 전체 삭제</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  useWishlist,
  useSearchHistory,
  useUserPreferences,
  useApiCache,
  useWatchHistory
} from '@/composables'
import type { Movie } from '@/types/movie'

// 인증
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)

// 위시리스트
const {
  wishlist,
  toggleWishlist,
  isInWishlist,
  removeFromWishlist,
  wishlistCount
} = useWishlist()

// 검색 히스토리
const {
  addSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
  getRecentSearches
} = useSearchHistory()

// 사용자 설정
const { preferences, setTheme } = useUserPreferences()

// API 캐싱
const {
  getCachedPopularMovies,
  cachePopularMovies,
  clearAllMovieCache,
  getCacheStats
} = useApiCache()

// 시청 기록
const {
  addToWatchHistory,
  isInWatchHistory,
  getMovieWatchHistory,
  getInProgressMovies,
  getWatchStats,
  updateWatchPosition
} = useWatchHistory()

// 상태
const searchQuery = ref('')
const movies = ref<Movie[]>([])
const loading = ref(false)
const isDevelopment = ref(import.meta.env.DEV)

// 계산된 값
const recentSearches = computed(() => getRecentSearches(5))
const inProgressMovies = computed(() => getInProgressMovies())
const watchStats = computed(() => getWatchStats())
const cacheStats = computed(() => getCacheStats())

// 메서드
const handleLogout = () => {
  authStore.logout()
}

const handleThemeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  setTheme(target.value as 'light' | 'dark' | 'system')
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return

  // 검색어 히스토리에 추가
  addSearchQuery(searchQuery.value)

  // 검색 로직 (캐시 활용)
  loading.value = true
  try {
    // 실제 API 호출 코드...
    console.log('검색:', searchQuery.value)
  } finally {
    loading.value = false
  }
}

const getImageUrl = (path: string) => {
  return `https://image.tmdb.org/t/p/w500${path}`
}

const watchMovie = (movie: Movie) => {
  // 시청 기록에 추가
  addToWatchHistory(movie, {
    watchProgress: 0,
    watchDuration: 0,
    completed: false,
    lastPosition: 0
  })

  // 영화 재생 페이지로 이동
  console.log('영화 재생:', movie.title)
}

const continueWatching = (item: any) => {
  // 마지막 재생 위치에서 이어서 보기
  console.log('이어서 보기:', item.movie.title, '위치:', item.lastPosition)
}

const clearCache = () => {
  if (confirm('모든 캐시를 삭제하시겠습니까?')) {
    clearAllMovieCache()
    alert('캐시가 삭제되었습니다.')
  }
}

const fetchPopularMovies = async () => {
  // 캐시 확인
  const cached = getCachedPopularMovies()
  if (cached) {
    movies.value = cached
    return
  }

  // API 호출
  loading.value = true
  try {
    // 실제 API 호출 코드...
    // const response = await fetch('/api/movies/popular')
    // const data = await response.json()

    // 임시 데이터 (실제로는 API에서 가져옴)
    const data: Movie[] = []

    // 캐시 저장
    cachePopularMovies(data)
    movies.value = data
  } catch (error) {
    console.error('영화 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// 생명주기
onMounted(() => {
  fetchPopularMovies()
})
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #ddd;
}

.search {
  margin: 20px 0;
}

.search input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.recent-searches {
  margin-top: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.recent-searches ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.recent-searches li {
  display: flex;
  gap: 5px;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.movie-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  transition: transform 0.2s;
}

.movie-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.movie-card img {
  width: 100%;
  border-radius: 4px;
}

.movie-card button {
  width: 100%;
  margin-top: 10px;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #007bff;
  color: white;
}

.movie-card button:hover {
  background: #0056b3;
}

.movie-card button.active {
  background: #ff4444;
}

progress {
  width: 100%;
  height: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stats-grid > div {
  text-align: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stats-grid h3 {
  font-size: 32px;
  margin: 0;
  color: #007bff;
}

.cache-info {
  margin-top: 40px;
  padding: 20px;
  background: #fff3cd;
  border-radius: 8px;
}
</style>
