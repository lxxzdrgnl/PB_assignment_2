<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tryLogin, tryRegister, isValidEmail, setKeepLogin } from '@/utils/auth'
import { storage, STORAGE_KEYS } from '@/utils/localStorage'
import type { User } from '@/types/movie'
import ToastNotification from '@/components/ToastNotification.vue'

const router = useRouter()
const authStore = useAuthStore()
const toastRef = ref<InstanceType<typeof ToastNotification> | null>(null)

const isSignUp = ref(false)
const email = ref('')
const apiKey = ref('')
const confirmApiKey = ref('')
const rememberMe = ref(false)
const agreeTerms = ref(false)
const emailError = ref('')
const apiKeyError = ref('')
const confirmApiKeyError = ref('')
const isLoading = ref(false)
const isEmailChecked = ref(false)
const isApiKeyValidated = ref(false)

const showToast = (type: 'success' | 'error', title: string, message: string) => {
  toastRef.value?.addToast(type, title, message)
}

const validateEmail = () => {
  if (!email.value) {
    emailError.value = '이메일을 입력해주세요.'
    return false
  }
  if (!isValidEmail(email.value)) {
    emailError.value = '올바른 이메일 형식이 아닙니다.'
    return false
  }
  emailError.value = ''
  return true
}

const validateApiKey = () => {
  if (!apiKey.value) {
    apiKeyError.value = 'TMDB API 키를 입력해주세요.'
    return false
  }
  if (apiKey.value.length < 20) {
    apiKeyError.value = 'TMDB API 키는 최소 20자 이상이어야 합니다.'
    return false
  }
  apiKeyError.value = ''
  return true
}

const validateConfirmApiKey = () => {
  if (isSignUp.value) {
    if (!confirmApiKey.value) {
      confirmApiKeyError.value = 'API 키 확인을 입력해주세요.'
      return false
    }
    if (apiKey.value !== confirmApiKey.value) {
      confirmApiKeyError.value = 'API 키가 일치하지 않습니다.'
      return false
    }
  }
  confirmApiKeyError.value = ''
  return true
}

// 이메일 중복 확인
const checkEmailDuplicate = () => {
  if (!validateEmail()) {
    return
  }

  isLoading.value = true

  // storage 유틸리티를 사용하여 사용자 목록 가져오기 (암호화된 데이터 복호화)
  const users: User[] = storage.getItem<User[]>(STORAGE_KEYS.AUTH_USERS) || []
  const userExists = users.some((user) => user.id === email.value)

  setTimeout(() => {
    if (userExists) {
      emailError.value = '이미 존재하는 이메일입니다.'
      isEmailChecked.value = false
      showToast('error', '중복 확인 실패', '이미 사용 중인 이메일입니다.')
    } else {
      isEmailChecked.value = true
      showToast('success', '중복 확인 성공', '사용 가능한 이메일입니다.')
    }
    isLoading.value = false
  }, 500)
}

// API 키 유효성 검증
const validateApiKeyOnServer = async () => {
  if (!validateApiKey()) {
    return
  }

  isLoading.value = true
  try {
    const { validateApiKey: checkApiKey } = await import('@/utils/tmdb')
    const isValid = await checkApiKey(apiKey.value)

    if (isValid) {
      isApiKeyValidated.value = true
      showToast('success', 'API 키 검증 성공', '유효한 TMDB API 키입니다.')
    } else {
      isApiKeyValidated.value = false
      apiKeyError.value = '유효하지 않은 TMDB API 키입니다.'
      showToast('error', 'API 키 검증 실패', '유효하지 않은 API 키입니다.')
    }
  } catch (error) {
    isApiKeyValidated.value = false
    apiKeyError.value = 'API 키 검증 중 오류가 발생했습니다.'
    showToast('error', '검증 오류', 'API 키 검증 중 오류가 발생했습니다.')
  } finally {
    isLoading.value = false
  }
}

const handleLogin = async () => {
  if (!validateEmail() || !validateApiKey()) {
    return
  }

  isLoading.value = true
  await tryLogin(
    email.value,
    apiKey.value,
    (user) => {
      authStore.login(user.id)
      if (rememberMe.value) {
        setKeepLogin(true)
      }
      showToast('success', '로그인 성공', '환영합니다!')
      setTimeout(() => {
        router.push('/')
      }, 1000)
    },
    (message) => {
      showToast('error', '로그인 실패', message)
    }
  )
  isLoading.value = false
}

const handleSignUp = async () => {
  if (!validateEmail() || !validateApiKey() || !validateConfirmApiKey()) {
    return
  }

  if (!isEmailChecked.value) {
    showToast('error', '회원가입 실패', '이메일 중복 확인을 해주세요.')
    return
  }

  if (!isApiKeyValidated.value) {
    showToast('error', '회원가입 실패', 'API 키 유효성 검증을 해주세요.')
    return
  }

  if (!agreeTerms.value) {
    showToast('error', '회원가입 실패', '약관에 동의해주세요.')
    return
  }

  isLoading.value = true
  await tryRegister(
    email.value,
    apiKey.value,
    () => {
      showToast('success', '회원가입 성공', '로그인 페이지로 이동합니다.')
      setTimeout(() => {
        isSignUp.value = false
        confirmApiKey.value = ''
        agreeTerms.value = false
        isEmailChecked.value = false
        isApiKeyValidated.value = false
      }, 1000)
    },
    (message) => {
      showToast('error', '회원가입 실패', message)
    }
  )
  isLoading.value = false
}

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  emailError.value = ''
  apiKeyError.value = ''
  confirmApiKeyError.value = ''
  confirmApiKey.value = ''
  agreeTerms.value = false
  isEmailChecked.value = false
  isApiKeyValidated.value = false
}

const handleSubmit = () => {
  if (isSignUp.value) {
    handleSignUp()
  } else {
    handleLogin()
  }
}

// 이메일이 변경되면 중복 확인 상태 초기화
watch(email, () => {
  if (isSignUp.value) {
    isEmailChecked.value = false
  }
})

// API 키가 변경되면 검증 상태 초기화
watch(apiKey, () => {
  if (isSignUp.value) {
    isApiKeyValidated.value = false
  }
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1 class="auth-title">{{ isSignUp ? '회원가입' : '로그인' }}</h1>
        <p class="auth-subtitle">
          {{ isSignUp ? 'MOVIEFLIX에 가입하고 다양한 영화를 감상하세요' : 'MOVIEFLIX에 오신 것을 환영합니다' }}
        </p>
      </div>

      <Transition name="fade" mode="out-in">
        <form class="auth-form" @submit.prevent="handleSubmit" :key="isSignUp ? 'signup' : 'signin'">
          <div class="input-group">
            <label class="input-label" for="email">이메일</label>
            <div class="input-with-button">
              <input
                id="email"
                type="email"
                class="input-field"
                :class="{ 'input-error': emailError, 'input-success': isSignUp && isEmailChecked }"
                v-model="email"
                @blur="validateEmail"
                placeholder="example@email.com"
                required
              />
              <button
                v-if="isSignUp"
                type="button"
                class="btn-check"
                :class="{ 'btn-checked': isEmailChecked }"
                @click="checkEmailDuplicate"
                :disabled="isLoading"
              >
                {{ isEmailChecked ? '확인완료' : '중복확인' }}
              </button>
            </div>
            <p v-if="emailError" class="error-message">{{ emailError }}</p>
          </div>

          <div class="input-group">
            <label class="input-label" for="apiKey">TMDB API 키</label>
            <div class="input-with-button">
              <input
                id="apiKey"
                type="text"
                class="input-field"
                :class="{ 'input-error': apiKeyError, 'input-success': isSignUp && isApiKeyValidated }"
                v-model="apiKey"
                @blur="validateApiKey"
                placeholder="TMDB API 키를 입력하세요"
                required
              />
              <button
                v-if="isSignUp"
                type="button"
                class="btn-check"
                :class="{ 'btn-checked': isApiKeyValidated }"
                @click="validateApiKeyOnServer"
                :disabled="isLoading"
              >
                {{ isApiKeyValidated ? '검증완료' : 'API 검증' }}
              </button>
            </div>
            <p v-if="apiKeyError" class="error-message">{{ apiKeyError }}</p>
          </div>

          <div v-if="isSignUp" class="input-group">
            <label class="input-label" for="confirmApiKey">TMDB API 키 확인</label>
            <input
              id="confirmApiKey"
              type="text"
              class="input-field"
              :class="{ 'input-error': confirmApiKeyError }"
              v-model="confirmApiKey"
              @blur="validateConfirmApiKey"
              placeholder="API 키를 다시 입력하세요"
              required
            />
            <p v-if="confirmApiKeyError" class="error-message">{{ confirmApiKeyError }}</p>
          </div>

          <div v-if="!isSignUp" class="checkbox-group">
            <input id="rememberMe" type="checkbox" class="checkbox-input" v-model="rememberMe" />
            <label for="rememberMe" class="checkbox-label">로그인 상태 유지</label>
          </div>

          <div v-if="isSignUp" class="checkbox-group">
            <input id="agreeTerms" type="checkbox" class="checkbox-input" v-model="agreeTerms" />
            <label for="agreeTerms" class="checkbox-label">
              서비스 이용약관 및 개인정보 처리방침에 동의합니다 (필수)
            </label>
          </div>

          <button type="submit" class="btn btn-primary w-full mt-3">
            {{ isSignUp ? '회원가입' : '로그인' }}
          </button>
        </form>
      </Transition>

      <div class="auth-toggle">
        {{ isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?' }}
        <span class="auth-toggle-btn" @click="toggleMode">
          {{ isSignUp ? '로그인' : '회원가입' }}
        </span>
      </div>
    </div>

    <ToastNotification ref="toastRef" />
  </div>
</template>

<style scoped>
.input-with-button {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.input-with-button .input-field {
  flex: 1;
}

.btn-check {
  padding: 0.75rem 1rem;
  background-color: var(--bg-light);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 90px;
}

.btn-check:hover:not(:disabled) {
  background-color: var(--bg-dark);
  border-color: var(--primary-color);
}

.btn-check:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-check.btn-checked {
  background-color: var(--primary-color);
  color: #ffffff;
  border-color: var(--primary-color);
}

.input-success {
  border-color: #10b981 !important;
}

.input-success:focus {
  outline-color: #10b981;
}
</style>
