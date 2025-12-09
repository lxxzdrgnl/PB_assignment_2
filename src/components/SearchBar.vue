<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="영화를 검색하세요..."
        @keyup.enter="handleSearch"
        @focus="showHistory = true"
      />
      <button v-if="searchQuery" class="clear-input-btn" @click="clearInput">
        ✕
      </button>
      <button class="search-btn" @click="handleSearch">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>
    </div>

    <!-- 검색 히스토리 드롭다운 -->
    <div v-if="showHistory && recentSearches.length > 0" class="search-history-dropdown">
      <div class="history-header">
        <span class="history-title">최근 검색어</span>
        <button class="clear-all-btn" @click="handleClearAll">전체 삭제</button>
      </div>

      <ul class="history-list">
        <li v-for="item in recentSearches" :key="item.query" class="history-item">
          <button class="history-query" @click="selectHistory(item.query)">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="history-icon"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>{{ item.query }}</span>
          </button>
          <button class="delete-btn" @click="handleDelete(item.query)" title="삭제">
            ✕
          </button>
        </li>
      </ul>
    </div>
  </div>

  <!-- 배경 클릭 시 드롭다운 닫기 -->
  <div v-if="showHistory" class="backdrop" @click="showHistory = false"></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSearchHistory } from '@/composables/useSearchHistory'

// Props
interface Props {
  modelValue?: string
  placeholder?: string
  maxHistoryItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '영화를 검색하세요...',
  maxHistoryItems: 10,
})

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', query: string): void
}>()

// 검색 히스토리 composable
const { addSearchQuery, removeSearchQuery, clearSearchHistory, getRecentSearches } =
  useSearchHistory()

// 상태
const searchQuery = ref(props.modelValue)
const showHistory = ref(false)

// 최근 검색어 (제한된 개수)
const recentSearches = computed(() => getRecentSearches(props.maxHistoryItems))

// 검색 실행
const handleSearch = () => {
  const query = searchQuery.value.trim()
  if (!query) return

  // 검색어 히스토리에 추가
  addSearchQuery(query)

  // 검색 이벤트 발생
  emit('search', query)
  emit('update:modelValue', query)

  // 히스토리 드롭다운 닫기
  showHistory.value = false
}

// 검색어 입력창 지우기
const clearInput = () => {
  searchQuery.value = ''
  emit('update:modelValue', '')
}

// 히스토리에서 검색어 선택
const selectHistory = (query: string) => {
  searchQuery.value = query
  emit('update:modelValue', query)
  handleSearch()
}

// 개별 검색어 삭제
const handleDelete = (query: string) => {
  removeSearchQuery(query)
}

// 전체 검색어 삭제
const handleClearAll = () => {
  if (confirm('모든 검색 기록을 삭제하시겠습니까?')) {
    clearSearchHistory()
    showHistory.value = false
  }
}

// 외부 클릭 감지하여 드롭다운 닫기
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.search-container')) {
    showHistory.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.search-input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input {
  flex: 1;
  padding: 14px 16px;
  border: none;
  outline: none;
  font-size: 16px;
  background: transparent;
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-input-btn {
  padding: 8px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 18px;
  transition: color 0.2s;
}

.clear-input-btn:hover {
  color: #1f2937;
}

.search-btn {
  padding: 14px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 0 10px 10px 0;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.search-btn:hover {
  background: #2563eb;
}

/* 검색 히스토리 드롭다운 */
.search-history-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 400px;
  overflow-y: auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.clear-all-btn {
  padding: 4px 12px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background: #f9fafb;
}

.history-query {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
}

.history-icon {
  color: #9ca3af;
  flex-shrink: 0;
}

.delete-btn {
  padding: 8px 12px;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s;
  flex-shrink: 0;
}

.delete-btn:hover {
  color: #ef4444;
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  .search-input-wrapper {
    background: #1f2937;
    border-color: #374151;
  }

  .search-input {
    color: #f9fafb;
  }

  .search-input::placeholder {
    color: #6b7280;
  }

  .search-history-dropdown {
    background: #1f2937;
    border-color: #374151;
  }

  .history-header {
    border-bottom-color: #374151;
  }

  .history-title {
    color: #f9fafb;
  }

  .history-item {
    border-bottom-color: #374151;
  }

  .history-item:hover {
    background: #374151;
  }

  .history-query {
    color: #f9fafb;
  }
}

/* 반응형 */
@media (max-width: 640px) {
  .search-container {
    max-width: 100%;
  }

  .search-input {
    font-size: 14px;
    padding: 12px 14px;
  }

  .search-btn {
    padding: 12px 16px;
  }
}
</style>
