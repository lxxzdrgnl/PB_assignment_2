<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWishlist } from '@/composables/useWishlist'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { wishlistCount } = useWishlist()
const { currentTheme, toggleTheme } = useTheme()

const isDark = computed(() => currentTheme.value === 'dark')

const isScrolled = ref(false)
const showBrowseMenu = ref(false)

const handleScroll = () => {
  // 히어로 배너 높이(90vh - 100px 정도) 이후에 헤더 배경 활성화
  const heroHeight = window.innerHeight * 0.9 - 100
  isScrolled.value = window.scrollY > heroHeight
}

const handleLogout = () => {
  authStore.logout()
  router.push('/signin')
}

const goHome = () => {
  router.push('/')
}

const toggleBrowseMenu = () => {
  showBrowseMenu.value = !showBrowseMenu.value
}

const closeBrowseMenu = () => {
  showBrowseMenu.value = false
}

const navigateTo = (path: string) => {
  router.push(path)
  closeBrowseMenu()
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.browse-menu-container')) {
    closeBrowseMenu()
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="header" :class="{ scrolled: isScrolled }">
    <div class="header-container">
      <div class="header-logo" @click="goHome">MOVIEFLIX</div>

      <div class="header-right">
        <nav class="header-nav">
          <!-- PC 버전 - 모든 메뉴 표시 -->
          <div class="header-nav-desktop">
            <RouterLink to="/" class="header-nav-link" :class="{ active: route.path === '/' }">
              <i class="fas fa-home"></i> 홈
            </RouterLink>
            <RouterLink
              to="/popular"
              class="header-nav-link"
              :class="{ active: route.path === '/popular' }"
            >
              <i class="fas fa-fire"></i> 인기
            </RouterLink>
            <RouterLink
              to="/search"
              class="header-nav-link"
              :class="{ active: route.path === '/search' }"
            >
              <i class="fas fa-search"></i> 검색
            </RouterLink>
            <RouterLink
              to="/wishlist"
              class="header-nav-link"
              :class="{ active: route.path === '/wishlist' }"
            >
              <i class="fas fa-heart"></i> 내 리스트
              <span v-if="wishlistCount > 0" class="wishlist-count">({{ wishlistCount }})</span>
            </RouterLink>
          </div>

          <!-- 모바일 버전 - 드롭다운 메뉴 -->
          <div class="header-nav-mobile">
            <div class="browse-menu-container">
              <button
                class="header-nav-link browse-toggle"
                :class="{ active: ['/', '/popular', '/search', '/wishlist'].includes(route.path) }"
                @click.stop="toggleBrowseMenu"
              >
                <i class="fas fa-th"></i> 둘러보기
                <i class="fas fa-chevron-down" :class="{ rotated: showBrowseMenu }"></i>
              </button>
              <Transition name="dropdown">
                <div v-if="showBrowseMenu" class="browse-dropdown">
                  <button
                    class="browse-dropdown-item"
                    :class="{ active: route.path === '/' }"
                    @click="navigateTo('/')"
                  >
                    <i class="fas fa-home"></i> 홈
                  </button>
                  <button
                    class="browse-dropdown-item"
                    :class="{ active: route.path === '/popular' }"
                    @click="navigateTo('/popular')"
                  >
                    <i class="fas fa-fire"></i> 인기 콘텐츠
                  </button>
                  <button
                    class="browse-dropdown-item"
                    :class="{ active: route.path === '/search' }"
                    @click="navigateTo('/search')"
                  >
                    <i class="fas fa-search"></i> 검색
                  </button>
                  <button
                    class="browse-dropdown-item"
                    :class="{ active: route.path === '/wishlist' }"
                    @click="navigateTo('/wishlist')"
                  >
                    <i class="fas fa-heart"></i> 내가 찜한 리스트
                    <span v-if="wishlistCount > 0" class="wishlist-badge">{{ wishlistCount }}</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </nav>

        <button class="btn-icon theme-toggle" @click="toggleTheme" :title="isDark ? '라이트 모드' : '다크 모드'">
          <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>

        <div class="header-user header-user-desktop">
          <span class="header-user-name">{{ authStore.user }}</span>
        </div>

        <button class="btn btn-ghost header-logout" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i> 로그아웃
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* 오른쪽 영역을 묶어서 처리 */
.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

/* PC에서는 모든 메뉴 표시 */
.header-nav-desktop {
  display: flex;
  gap: 2rem;
  align-items: center;
}

/* 모바일에서는 드롭다운 메뉴 표시 */
.header-nav-mobile {
  display: none;
  gap: 0;
  align-items: center;
}

.browse-menu-container {
  position: relative;
}

.browse-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  padding: 0.5rem 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

[data-theme='light'] .header:not(.scrolled) .browse-toggle {
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.browse-toggle .fa-chevron-down {
  font-size: 0.75rem;
  transition: transform var(--transition-speed) var(--transition-ease);
}

.browse-toggle .fa-chevron-down.rotated {
  transform: rotate(180deg);
}

.browse-dropdown {
  position: absolute;
  top: calc(100% + 1rem);
  left: 0;
  background-color: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  min-width: 200px;
}

[data-theme='light'] .browse-dropdown {
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  padding: 0.5rem 0;
  z-index: 1000;
}

.browse-dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--transition-speed) var(--transition-ease);
  text-align: left;
  position: relative;
}

.browse-dropdown-item:hover {
  background-color: var(--bg-light);
  color: var(--primary-color);
}

.browse-dropdown-item.active {
  color: var(--primary-color);
  font-weight: 600;
}

.browse-dropdown-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background-color: var(--primary-color);
}

.browse-dropdown-item i {
  width: 20px;
  text-align: center;
}

.wishlist-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.wishlist-badge {
  display: inline-block;
  background-color: var(--primary-color);
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  margin-left: 0.5rem;
  min-width: 20px;
  text-align: center;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s var(--transition-ease);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.theme-toggle {
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: all var(--transition-speed) var(--transition-ease);
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

[data-theme='light'] .header:not(.scrolled) .theme-toggle {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.5);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.theme-toggle:hover {
  background-color: var(--bg-light);
  border-color: var(--primary-color);
  transform: rotate(20deg);
}

.theme-toggle i {
  font-size: 1.1rem;
}

.header-logout {
  padding: 0.5rem 1.25rem !important;
  font-size: 0.9rem !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  white-space: nowrap;
  min-width: auto;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

[data-theme='light'] .header:not(.scrolled) .header-logout {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.5);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

@media (max-width: 768px) {
  /* 태블릿부터 드롭다운 메뉴 표시 */
  .header-nav-desktop {
    display: none;
  }

  .header-nav-mobile {
    display: flex;
  }

  .header-right {
    gap: 0.5rem;
  }

  .header-logout {
    padding: 0.4rem 0.75rem !important;
    font-size: 0.85rem !important;
  }

  .browse-dropdown {
    min-width: 180px;
    left: 50%;
    transform: translateX(-50%);
  }

  .browse-dropdown-item {
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
  }

  .header-user-desktop {
    display: none;
  }
}

.header-user-name {
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

[data-theme='light'] .header:not(.scrolled) .header-user-name {
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

@media (max-width: 480px) {
  .browse-dropdown {
    min-width: 160px;
  }

  .browse-dropdown-item {
    padding: 0.625rem 1rem;
    font-size: 0.85rem;
  }

  .header-right {
    gap: 0.25rem;
  }

  .header-user-desktop {
    display: none;
  }

  .header-logout {
    padding: 0.4rem 0.6rem !important;
    font-size: 0.8rem !important;
  }

  .header-logout i {
    margin-right: 0.25rem;
  }
}
</style>
