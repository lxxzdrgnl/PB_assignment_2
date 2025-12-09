# SearchBar 컴포넌트 사용 가이드

검색 히스토리 기능이 포함된 SearchBar 컴포넌트 사용 방법입니다.

## 기본 사용법

```vue
<template>
  <div>
    <SearchBar @search="handleSearch" />

    <div v-if="searchResults.length > 0">
      <h2>검색 결과</h2>
      <MovieCard v-for="movie in searchResults" :key="movie.id" :movie="movie" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MovieCard from '@/components/MovieCard.vue'
import type { Movie } from '@/types/movie'

const searchResults = ref<Movie[]>([])

const handleSearch = async (query: string) => {
  console.log('검색어:', query)

  // API 호출로 영화 검색
  try {
    const response = await fetch(`/api/search?query=${query}`)
    const data = await response.json()
    searchResults.value = data.results
  } catch (error) {
    console.error('검색 실패:', error)
  }
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | v-model로 사용할 검색어 값 |
| `placeholder` | `string` | `'영화를 검색하세요...'` | 입력 필드 플레이스홀더 |
| `maxHistoryItems` | `number` | `10` | 표시할 최대 검색 히스토리 개수 |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `search` | `string` | 검색 실행 시 발생 (검색어 전달) |
| `update:modelValue` | `string` | v-model 업데이트 시 발생 |

## v-model 사용

```vue
<template>
  <div>
    <SearchBar v-model="searchQuery" @search="handleSearch" />
    <p>현재 검색어: {{ searchQuery }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from '@/components/SearchBar.vue'

const searchQuery = ref('')

const handleSearch = (query: string) => {
  console.log('검색:', query)
}
</script>
```

## 기능

### 1. 자동 완성 검색 히스토리

- 입력 필드에 포커스하면 최근 검색어가 드롭다운으로 표시됩니다
- 최대 10개(또는 설정한 개수)의 최근 검색어가 표시됩니다

### 2. 검색어 개별 삭제

- 각 검색어 옆의 'x' 버튼을 클릭하면 해당 검색어만 삭제됩니다

### 3. 전체 검색어 삭제

- 드롭다운 상단의 "전체 삭제" 버튼으로 모든 검색 기록을 삭제할 수 있습니다
- 확인 다이얼로그가 표시됩니다

### 4. 검색어 재사용

- 검색 히스토리에서 검색어를 클릭하면 해당 검색어로 다시 검색합니다

### 5. 입력창 지우기

- 검색어 입력 중 'x' 버튼이 나타나며, 클릭하면 입력 내용이 지워집니다

### 6. 외부 클릭 감지

- 검색 컴포넌트 외부를 클릭하면 드롭다운이 자동으로 닫힙니다

## 스타일링

### 라이트/다크 모드 지원

컴포넌트는 시스템 테마에 따라 자동으로 다크 모드를 지원합니다.

### 커스터마이징

스타일을 커스터마이징하려면 SearchBar.vue의 `<style scoped>` 섹션을 수정하세요:

```css
/* 검색 버튼 색상 변경 */
.search-btn {
  background: #your-color;
}

/* 드롭다운 스타일 변경 */
.search-history-dropdown {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## 실제 사용 예제

### 영화 검색 페이지

```vue
<template>
  <div class="search-page">
    <h1>영화 검색</h1>

    <SearchBar
      v-model="searchQuery"
      @search="handleSearch"
      placeholder="영화 제목, 배우, 감독을 검색하세요"
      :max-history-items="15"
    />

    <div v-if="loading" class="loading">
      <LoadingSpinner />
    </div>

    <div v-else-if="searchResults.length > 0" class="results">
      <h2>검색 결과 ({{ searchResults.length }}개)</h2>
      <div class="movie-grid">
        <MovieCard
          v-for="movie in searchResults"
          :key="movie.id"
          :movie="movie"
        />
      </div>
    </div>

    <div v-else-if="hasSearched" class="no-results">
      <p>검색 결과가 없습니다.</p>
      <p>다른 검색어를 시도해보세요.</p>
    </div>

    <div v-else class="empty-state">
      <p>영화를 검색해보세요!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import MovieCard from '@/components/MovieCard.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useApiCache } from '@/composables/useApiCache'
import type { Movie } from '@/types/movie'

const { getCachedSearchResults, cacheSearchResults } = useApiCache()

const searchQuery = ref('')
const searchResults = ref<Movie[]>([])
const loading = ref(false)
const hasSearched = ref(false)

const handleSearch = async (query: string) => {
  if (!query.trim()) return

  hasSearched.value = true
  loading.value = true

  try {
    // 캐시 확인
    const cached = getCachedSearchResults(query)
    if (cached) {
      searchResults.value = cached
      loading.value = false
      return
    }

    // API 호출
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=YOUR_API_KEY&language=ko-KR`
    )
    const data = await response.json()

    searchResults.value = data.results || []

    // 결과 캐싱
    cacheSearchResults(query, searchResults.value)
  } catch (error) {
    console.error('검색 실패:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.search-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  text-align: center;
  margin-bottom: 40px;
  font-size: 32px;
  color: #1f2937;
}

.loading {
  text-align: center;
  padding: 60px 0;
}

.results {
  margin-top: 40px;
}

.results h2 {
  margin-bottom: 20px;
  color: #374151;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.no-results,
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #6b7280;
}

.no-results p,
.empty-state p {
  font-size: 18px;
  margin: 8px 0;
}
</style>
```

## 주의사항

1. **검색 히스토리 저장**
   - 검색 히스토리는 사용자별로 Local Storage에 저장됩니다
   - 로그인한 사용자가 바뀌면 각자의 검색 히스토리가 표시됩니다

2. **최대 저장 개수**
   - 최대 20개의 검색어가 저장됩니다
   - 새로운 검색어가 추가되면 가장 오래된 검색어가 삭제됩니다

3. **중복 검색어**
   - 같은 검색어를 다시 검색하면 최상단으로 이동합니다
   - 중복된 검색어는 저장되지 않습니다

4. **빈 검색어**
   - 빈 문자열이나 공백만 있는 검색어는 히스토리에 저장되지 않습니다

## 트러블슈팅

### 검색 히스토리가 표시되지 않는 경우

1. `useSearchHistory` composable이 제대로 import 되었는지 확인
2. Local Storage가 지원되는 브라우저인지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 검색 히스토리가 사라지는 경우

1. 브라우저 데이터 삭제 여부 확인
2. 시크릿 모드에서는 Local Storage가 제한될 수 있습니다
3. Storage quota가 초과되었는지 확인

### 스타일이 깨지는 경우

1. Scoped CSS가 제대로 적용되었는지 확인
2. 다른 컴포넌트의 전역 스타일과 충돌하는지 확인
3. CSS 변수나 Tailwind CSS 사용 여부 확인

## 추가 개선 사항

향후 추가할 수 있는 기능:

1. **인기 검색어 표시**
   - 가장 많이 검색된 검색어 표시
   - `getPopularSearches()` 함수 사용

2. **검색어 자동 완성**
   - API를 통한 실시간 자동 완성 제안

3. **카테고리별 검색**
   - 영화, 배우, 감독 등 카테고리 선택

4. **고급 필터**
   - 장르, 년도, 평점 등으로 필터링

5. **음성 검색**
   - Web Speech API를 사용한 음성 검색

## 참고 자료

- [useSearchHistory composable 문서](../src/composables/useSearchHistory.ts)
- [Local Storage 가이드](../LOCAL_STORAGE_GUIDE.md)
- [Vue 3 Composables](https://vuejs.org/guide/reusability/composables.html)
