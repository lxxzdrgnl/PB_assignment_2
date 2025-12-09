# Local Storage 활용 가이드

이 문서는 영화 애플리케이션에서 Local Storage를 활용하는 방법을 설명합니다.

## 목차

1. [개요](#개요)
2. [핵심 기능](#핵심-기능)
3. [사용 방법](#사용-방법)
4. [보안 고려사항](#보안-고려사항)
5. [성능 최적화](#성능-최적화)

---

## 개요

이 애플리케이션은 고급 Local Storage 관리 시스템을 구현하여 다음과 같은 기능을 제공합니다:

- 데이터 암호화/복호화
- 유효기간 관리
- 에러 핸들링
- 타입 안전성
- 용량 관리
- 자동 정리

## 핵심 기능

### 1. 인증 관리 (`src/utils/auth.ts`)

사용자 인증 정보를 안전하게 저장하고 관리합니다.

```typescript
import { tryLogin, tryRegister, logout, isLoggedIn, getCurrentUser } from '@/utils/auth'

// 회원가입
tryRegister(
  'user@example.com',
  'password123',
  () => console.log('회원가입 성공'),
  (error) => console.error(error)
)

// 로그인
tryLogin(
  'user@example.com',
  'password123',
  (user) => console.log('로그인 성공', user),
  () => console.error('로그인 실패')
)

// 로그인 상태 확인
if (isLoggedIn()) {
  const user = getCurrentUser()
  console.log('현재 사용자:', user)
}

// 로그아웃
logout()
```

**주요 기능:**
- 비밀번호 암호화 저장
- 세션 만료 자동 관리 (24시간)
- 로그인 유지 (Keep Login) 기능
- 이메일 유효성 검사

---

### 2. 위시리스트 관리 (`src/composables/useWishlist.ts`)

사용자가 즐겨찾기한 영화 목록을 관리합니다.

```vue
<script setup>
import { useWishlist } from '@/composables'

const {
  wishlist,
  toggleWishlist,
  isInWishlist,
  removeFromWishlist,
  clearWishlist,
  wishlistCount
} = useWishlist()

// 영화 추가/제거
const handleWishlist = (movie) => {
  toggleWishlist(movie)
}

// 위시리스트에 있는지 확인
const isFavorite = isInWishlist(movieId)

// 전체 삭제
const handleClear = () => {
  clearWishlist()
}
</script>

<template>
  <div>
    <p>위시리스트 개수: {{ wishlistCount }}</p>
    <div v-for="movie in wishlist" :key="movie.id">
      {{ movie.title }}
      <button @click="removeFromWishlist(movie.id)">삭제</button>
    </div>
  </div>
</template>
```

**주요 기능:**
- 사용자별 위시리스트 분리 저장
- 자동 중복 방지
- 실시간 개수 업데이트
- 로그인한 사용자 변경 시 자동 로드

---

### 3. 검색 히스토리 (`src/composables/useSearchHistory.ts`)

최근 검색어를 저장하고 관리합니다.

```vue
<script setup>
import { useSearchHistory } from '@/composables'

const {
  searchHistory,
  addSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
  getRecentSearches,
  getPopularSearches,
  historyCount
} = useSearchHistory()

// 검색어 추가
const handleSearch = (query) => {
  addSearchQuery(query)
  // 실제 검색 로직...
}

// 최근 검색어 가져오기
const recentSearches = getRecentSearches(5)

// 인기 검색어 가져오기
const popularSearches = getPopularSearches(5)
</script>

<template>
  <div>
    <input @keyup.enter="handleSearch($event.target.value)" />

    <div class="recent-searches">
      <h3>최근 검색어</h3>
      <ul>
        <li v-for="item in recentSearches" :key="item.query">
          {{ item.query }}
          <button @click="removeSearchQuery(item.query)">삭제</button>
        </li>
      </ul>
      <button @click="clearSearchHistory">전체 삭제</button>
    </div>

    <div class="popular-searches">
      <h3>인기 검색어</h3>
      <ul>
        <li v-for="query in popularSearches" :key="query">
          {{ query }}
        </li>
      </ul>
    </div>
  </div>
</template>
```

**주요 기능:**
- 최대 20개의 검색어 저장
- 중복 검색어 자동 제거 (최신으로 이동)
- 인기 검색어 계산 (빈도수 기반)
- 사용자별 검색 히스토리 분리

---

### 4. 사용자 설정 (`src/composables/useUserPreferences.ts`)

테마, 언어 등 사용자 설정을 관리합니다.

```vue
<script setup>
import { useUserPreferences } from '@/composables'

const {
  preferences,
  setTheme,
  setLanguage,
  setAutoPlay,
  setShowAdultContent,
  resetPreferences,
  getPreferences
} = useUserPreferences()

// 테마 변경
const changeTheme = (theme) => {
  setTheme(theme) // 'light', 'dark', 'system'
}

// 언어 변경
const changeLanguage = (lang) => {
  setLanguage(lang) // 'ko', 'en', 'ja'
}

// 설정 초기화
const handleReset = () => {
  if (confirm('모든 설정을 초기화하시겠습니까?')) {
    resetPreferences()
  }
}
</script>

<template>
  <div class="settings">
    <h2>설정</h2>

    <!-- 테마 설정 -->
    <div>
      <label>테마</label>
      <select :value="preferences.theme" @change="changeTheme($event.target.value)">
        <option value="light">라이트</option>
        <option value="dark">다크</option>
        <option value="system">시스템 설정</option>
      </select>
    </div>

    <!-- 언어 설정 -->
    <div>
      <label>언어</label>
      <select :value="preferences.language" @change="changeLanguage($event.target.value)">
        <option value="ko">한국어</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
      </select>
    </div>

    <!-- 자동 재생 -->
    <div>
      <label>
        <input
          type="checkbox"
          :checked="preferences.autoPlay"
          @change="setAutoPlay($event.target.checked)"
        />
        자동 재생
      </label>
    </div>

    <!-- 성인 콘텐츠 -->
    <div>
      <label>
        <input
          type="checkbox"
          :checked="preferences.showAdultContent"
          @change="setShowAdultContent($event.target.checked)"
        />
        성인 콘텐츠 표시
      </label>
    </div>

    <button @click="handleReset">설정 초기화</button>
  </div>
</template>
```

**주요 기능:**
- 테마 자동 적용 (light/dark/system)
- 시스템 테마 변경 자동 감지
- 사용자별 설정 저장
- 기본값으로 초기화 가능

---

### 5. API 캐싱 (`src/composables/useApiCache.ts`)

API 호출을 최소화하고 성능을 향상시킵니다.

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useApiCache } from '@/composables'

const {
  getCachedPopularMovies,
  cachePopularMovies,
  getCachedGenres,
  cacheGenres,
  getCachedMovieDetails,
  cacheMovieDetails,
  fetchWithCache,
  clearAllMovieCache,
  getCacheStats
} = useApiCache()

const movies = ref([])
const genres = ref([])

// 인기 영화 가져오기 (캐시 사용)
const fetchPopularMovies = async () => {
  // 캐시 확인
  const cached = getCachedPopularMovies()
  if (cached) {
    movies.value = cached
    return
  }

  // API 호출
  const response = await fetch('/api/movies/popular')
  const data = await response.json()

  // 캐시 저장 (30분)
  cachePopularMovies(data)
  movies.value = data
}

// fetchWithCache를 사용한 간편한 방법
const fetchGenres = async () => {
  genres.value = await fetchWithCache(
    'genres',
    async () => {
      const response = await fetch('/api/genres')
      return response.json()
    },
    7 * 24 * 60 * 60 * 1000 // 1주일
  )
}

// 캐시 통계 확인
const showCacheStats = () => {
  const stats = getCacheStats()
  console.log('캐시 크기:', stats.size)
  console.log('캐시 항목 수:', stats.itemCount)
  console.log('캐시 키 목록:', stats.cacheKeys)
}

// 캐시 전체 삭제
const clearCache = () => {
  clearAllMovieCache()
  console.log('모든 캐시가 삭제되었습니다.')
}

onMounted(() => {
  fetchPopularMovies()
  fetchGenres()
})
</script>
```

**주요 기능:**
- 자동 캐시 만료 관리
- 유효기간 설정 (SHORT: 5분, MEDIUM: 30분, LONG: 24시간, WEEK: 1주일)
- 조건부 API 호출 (`fetchWithCache`)
- 캐시 통계 및 관리
- 영화 이미지 URL 캐싱

**캐시 전략:**
- **인기 영화**: 30분 캐시
- **트렌딩 영화**: 5분 캐시 (자주 변경됨)
- **장르 목록**: 1주일 캐시 (거의 변경되지 않음)
- **영화 상세 정보**: 24시간 캐시
- **검색 결과**: 30분 캐시

---

### 6. 시청 기록 (`src/composables/useWatchHistory.ts`)

사용자의 영화 시청 기록을 관리합니다.

```vue
<script setup>
import { useWatchHistory } from '@/composables'

const {
  watchHistory,
  addToWatchHistory,
  isInWatchHistory,
  getMovieWatchHistory,
  getCompletedMovies,
  getInProgressMovies,
  getRecentWatchedMovies,
  updateWatchPosition,
  removeFromWatchHistory,
  clearWatchHistory,
  getWatchStats,
  historyCount,
  completedCount,
  inProgressCount
} = useWatchHistory()

// 영화 시청 기록 추가
const watchMovie = (movie) => {
  addToWatchHistory(movie, {
    watchProgress: 0,
    watchDuration: 0,
    completed: false,
    lastPosition: 0
  })
}

// 재생 위치 업데이트
const handleVideoProgress = (movieId, currentTime, duration) => {
  const progress = (currentTime / duration) * 100
  updateWatchPosition(movieId, currentTime, progress)
}

// 영화 완료 표시
const completeMovie = (movie) => {
  addToWatchHistory(movie, {
    watchProgress: 100,
    watchDuration: movie.runtime * 60,
    completed: true
  })
}

// 통계 확인
const stats = getWatchStats()
console.log('총 시청 영화:', stats.totalMovies)
console.log('완료한 영화:', stats.completedMovies)
console.log('시청 중인 영화:', stats.inProgressMovies)
console.log('총 시청 시간:', stats.totalWatchTime, '분')
</script>

<template>
  <div>
    <!-- 시청 중인 영화 -->
    <section>
      <h2>시청 중인 영화 ({{ inProgressCount }})</h2>
      <div v-for="item in getInProgressMovies()" :key="item.movie.id">
        <img :src="item.movie.poster_path" :alt="item.movie.title" />
        <h3>{{ item.movie.title }}</h3>
        <progress :value="item.watchProgress" max="100"></progress>
        <p>{{ item.watchProgress }}% 시청</p>
      </div>
    </section>

    <!-- 최근 시청 영화 -->
    <section>
      <h2>최근 시청한 영화</h2>
      <div v-for="item in getRecentWatchedMovies(10)" :key="item.movie.id">
        <img :src="item.movie.poster_path" :alt="item.movie.title" />
        <h3>{{ item.movie.title }}</h3>
        <p>{{ new Date(item.watchedAt).toLocaleDateString() }}</p>
        <button @click="removeFromWatchHistory(item.movie.id)">삭제</button>
      </div>
    </section>

    <!-- 통계 -->
    <section>
      <h2>시청 통계</h2>
      <p>총 시청 영화: {{ stats.totalMovies }}</p>
      <p>완료한 영화: {{ stats.completedMovies }}</p>
      <p>총 시청 시간: {{ stats.totalWatchTime }}분</p>
      <button @click="clearWatchHistory">기록 전체 삭제</button>
    </section>
  </div>
</template>
```

**주요 기능:**
- 시청 진행률 추적
- 마지막 재생 위치 저장
- 시청 완료 자동 감지 (90% 이상)
- 시청 통계 제공
- 최대 100개 기록 저장
- 사용자별 기록 분리

---

## 보안 고려사항

### 1. 데이터 암호화

민감한 데이터는 자동으로 암호화되어 저장됩니다:

```typescript
// 사용자 비밀번호는 암호화하여 저장
storage.setItem(STORAGE_KEYS.AUTH_USERS, users, { encrypt: true })
```

### 2. XSS 공격 방지

- 모든 입력 데이터는 검증됩니다
- HTML 이스케이프 처리
- 외부 스크립트 실행 방지

### 3. 민감한 정보 제외

다음 정보는 Local Storage에 저장하지 않습니다:
- 신용카드 정보
- 주민등록번호
- 실제 결제 정보

### 4. 데이터 유효성 검증

```typescript
// 손상된 데이터 자동 제거
try {
  const data = JSON.parse(item)
  // 데이터 사용...
} catch (e) {
  storage.removeItem(key) // 손상된 데이터 삭제
}
```

---

## 성능 최적화

### 1. API 호출 최소화

```typescript
// 캐시를 활용하여 API 호출 감소
const movies = await fetchWithCache(
  'popular_movies',
  fetchFromAPI,
  CACHE_DURATION.MEDIUM
)
```

### 2. 자동 정리

- 만료된 캐시 자동 삭제 (24시간마다)
- Storage 용량 초과 시 자동 정리
- 가장 오래된 캐시부터 삭제

### 3. 용량 관리

```typescript
// Storage 크기 확인
const size = storage.getReadableSize()
console.log('현재 Storage 크기:', size)

// Storage 정보 확인
const info = storage.getStorageInfo()
console.log('Storage 정보:', info)
```

### 4. 브라우저 호환성

```typescript
// 자동으로 Local Storage 지원 여부 확인
if (storage.isStorageSupported()) {
  // Storage 사용 가능
} else {
  // Fallback 메커니즘 사용
}
```

---

## Storage 키 네이밍 규칙

모든 Storage 키는 `STORAGE_KEYS` 상수로 관리됩니다:

```typescript
// 인증 관련
STORAGE_KEYS.AUTH_USERS
STORAGE_KEYS.AUTH_CURRENT_USER
STORAGE_KEYS.AUTH_IS_LOGGED_IN
STORAGE_KEYS.AUTH_KEEP_LOGIN
STORAGE_KEYS.AUTH_SESSION_EXPIRY

// 사용자 데이터
STORAGE_KEYS.USER_WISHLIST
STORAGE_KEYS.USER_WATCH_HISTORY
STORAGE_KEYS.USER_SEARCH_HISTORY
STORAGE_KEYS.USER_PREFERENCES

// 캐시
STORAGE_KEYS.CACHE_MOVIES
STORAGE_KEYS.CACHE_GENRES
STORAGE_KEYS.CACHE_POPULAR
```

---

## 에러 핸들링

### Storage Quota 초과

```typescript
try {
  storage.setItem('key', largeData)
} catch (e) {
  if (e instanceof StorageError && e.code === 'QUOTA_EXCEEDED') {
    console.error('Storage 용량 초과')
    // 자동으로 오래된 캐시 정리 시도
  }
}
```

### 손상된 데이터

```typescript
try {
  const data = storage.getItem('key')
} catch (e) {
  if (e instanceof StorageError && e.code === 'PARSE_ERROR') {
    console.error('데이터 파싱 실패')
    // 손상된 데이터는 자동으로 삭제됨
  }
}
```

---

## 디버깅

```typescript
// Storage 정보 출력
console.log(storage.getStorageInfo())

// 모든 키 출력
console.log(storage.getAllKeys())

// 캐시 통계
const stats = useApiCache().getCacheStats()
console.log('캐시 통계:', stats)

// 시청 통계
const watchStats = useWatchHistory().getWatchStats()
console.log('시청 통계:', watchStats)
```

---

## 마이그레이션

Storage 구조가 변경되면 자동으로 마이그레이션됩니다:

```typescript
// src/utils/localStorage.ts
const CURRENT_STORAGE_VERSION = '1.0.0'

// 버전이 다르면 자동으로 migrate() 함수 실행
// 레거시 키를 새 키로 자동 변환
```

---

## 주의사항

1. **용량 제한**: Local Storage는 일반적으로 5-10MB 제한이 있습니다
2. **동기 API**: Local Storage는 동기 API이므로 대용량 데이터 저장 시 주의
3. **보안**: 민감한 정보는 암호화하여 저장하지만, 완벽한 보안은 아닙니다
4. **브라우저 제한**: 시크릿 모드나 일부 브라우저에서는 사용할 수 없습니다
5. **데이터 손실**: 사용자가 브라우저 데이터를 삭제하면 모든 데이터가 손실됩니다

---

## 참고 자료

- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Vue 3 Composables](https://vuejs.org/guide/reusability/composables.html)
- [TypeScript Documentation](https://www.typescriptlang.org/)
