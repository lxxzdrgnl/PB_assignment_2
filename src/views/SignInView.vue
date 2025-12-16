<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tryLogin, tryRegister, isValidEmail, setKeepLogin } from '@/utils/auth'
import { storage, STORAGE_KEYS } from '@/utils/localStorage'
import type { User } from '@/types/movie'
import ToastNotification from '@/components/ToastNotification.vue'

const { t } = useI18n()
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
    emailError.value = t('signIn.errors.emailRequired')
    return false
  }
  if (!isValidEmail(email.value)) {
    emailError.value = t('signIn.errors.invalidEmail')
    return false
  }
  emailError.value = ''
  return true
}

const validateApiKey = () => {
  if (!apiKey.value) {
    apiKeyError.value = t('signIn.errors.apiKeyRequired')
    return false
  }
  if (apiKey.value.length < 20) {
    apiKeyError.value = t('signIn.errors.apiKeyMinLength')
    return false
  }
  apiKeyError.value = ''
  return true
}

const validateConfirmApiKey = () => {
  if (isSignUp.value) {
    if (!confirmApiKey.value) {
      confirmApiKeyError.value = t('signIn.errors.confirmApiKeyRequired')
      return false
    }
    if (apiKey.value !== confirmApiKey.value) {
      confirmApiKeyError.value = t('signIn.errors.apiKeyMismatch')
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
      emailError.value = t('signIn.errors.emailExists')
      isEmailChecked.value = false
      showToast(
        'error',
        t('signIn.errors.emailCheckFailed'),
        t('signIn.errors.emailExists')
      )
    } else {
      isEmailChecked.value = true
      showToast(
        'success',
        t('signIn.errors.emailCheckSuccess'),
        t('signIn.errors.emailAvailable')
      )
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
      showToast(
        'success',
        t('signIn.errors.apiValidationSuccess'),
        t('signIn.errors.validApiKey')
      )
    } else {
      isApiKeyValidated.value = false
      apiKeyError.value = t('signIn.errors.invalidApiKey')
      showToast('error', t('signIn.errors.apiValidationFailed'), t('signIn.errors.invalidApiKey'))
    }
  } catch (error) {
    isApiKeyValidated.value = false
    apiKeyError.value = t('signIn.errors.apiKeyCheckError')
    showToast('error', t('signIn.errors.apiValidationError'), t('signIn.errors.apiKeyCheckError'))
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
      showToast('success', t('signIn.success.loginSuccess'), t('signIn.success.welcome'))
      setTimeout(() => {
        router.push('/')
      }, 1000)
    },
    (message) => {
      showToast('error', t('signIn.errors.loginFailed'), message)
    }
  )
  isLoading.value = false
}

const handleSignUp = async () => {
  if (!validateEmail() || !validateApiKey() || !validateConfirmApiKey()) {
    return
  }

  if (!isEmailChecked.value) {
    showToast('error', t('signIn.errors.signUpFailed'), t('signIn.errors.emailNotChecked'))
    return
  }

  if (!isApiKeyValidated.value) {
    showToast('error', t('signIn.errors.signUpFailed'), t('signIn.errors.apiKeyNotValidated'))
    return
  }

  if (!agreeTerms.value) {
    showToast('error', t('signIn.errors.signUpFailed'), t('signIn.errors.agreeTermsRequired'))
    return
  }

  isLoading.value = true
  await tryRegister(
    email.value,
    apiKey.value,
    () => {
      showToast(
        'success',
        t('signIn.success.signUpSuccess'),
        t('signIn.success.redirectingToSignIn')
      )
      setTimeout(() => {
        isSignUp.value = false
        confirmApiKey.value = ''
        agreeTerms.value = false
        isEmailChecked.value = false
        isApiKeyValidated.value = false
      }, 1000)
    },
    (message) => {
      showToast('error', t('signIn.errors.signUpFailed'), message)
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
        <h1 class="auth-title">{{ isSignUp ? t('signIn.signUpTitle') : t('signIn.signInTitle') }}</h1>
        <p class="auth-subtitle">
          {{ isSignUp ? t('signIn.signUpSubtitle') : t('signIn.signInSubtitle') }}
        </p>
      </div>

      <form
        class="auth-form"
        @submit.prevent="handleSubmit"
        :key="isSignUp ? 'signup' : 'signin'"
      >
        <div class="input-group">
          <label class="input-label" for="email">{{ t('signIn.emailLabel') }}</label>
          <div class="input-with-button">
            <input
              id="email"
              type="email"
              class="input-field"
              :class="{ 'input-error': emailError, 'input-success': isSignUp && isEmailChecked }"
              v-model="email"
              @blur="validateEmail"
              :placeholder="t('signIn.emailPlaceholder')"
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
              {{
                isEmailChecked ? t('signIn.checkDuplicateSuccess') : t('signIn.checkDuplicate')
              }}
            </button>
          </div>
          <p v-if="emailError" class="error-message">{{ emailError }}</p>
        </div>

        <div class="input-group">
          <label class="input-label" for="apiKey">{{ t('signIn.apiKeyLabel') }}</label>
          <div class="input-with-button">
            <input
              id="apiKey"
              type="text"
              class="input-field"
              :class="{
                'input-error': apiKeyError,
                'input-success': isSignUp && isApiKeyValidated
              }"
              v-model="apiKey"
              @blur="validateApiKey"
              :placeholder="t('signIn.apiKeyPlaceholder')"
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
              {{ isApiKeyValidated ? t('signIn.validateApiSuccess') : t('signIn.validateApi') }}
            </button>
          </div>
          <p v-if="apiKeyError" class="error-message">{{ apiKeyError }}</p>
        </div>

        <div v-if="isSignUp" class="input-group">
          <label class="input-label" for="confirmApiKey">{{
            t('signIn.confirmApiKeyLabel')
          }}</label>
          <input
            id="confirmApiKey"
            type="text"
            class="input-field"
            :class="{ 'input-error': confirmApiKeyError }"
            v-model="confirmApiKey"
            @blur="validateConfirmApiKey"
            :placeholder="t('signIn.confirmApiKeyPlaceholder')"
            required
          />
          <p v-if="confirmApiKeyError" class="error-message">{{ confirmApiKeyError }}</p>
        </div>

        <div v-if="!isSignUp" class="checkbox-group">
          <input id="rememberMe" type="checkbox" class="checkbox-input" v-model="rememberMe" />
          <label for="rememberMe" class="checkbox-label">{{ t('signIn.rememberMe') }}</label>
        </div>

        <div v-if="isSignUp" class="checkbox-group">
          <input id="agreeTerms" type="checkbox" class="checkbox-input" v-model="agreeTerms" />
          <label for="agreeTerms" class="checkbox-label">
            {{ t('signIn.agreeTerms') }}
          </label>
        </div>

        <button type="submit" class="btn btn-primary w-full mt-3">
          {{ isSignUp ? t('signIn.signUpButton') : t('signIn.signInButton') }}
        </button>
      </form>

      <div class="auth-toggle">
        {{ isSignUp ? t('signIn.toggleToSignIn') : t('signIn.toggleToSignUp') }}
        <span class="auth-toggle-btn" @click="toggleMode">
          {{ isSignUp ? t('signIn.signInButton') : t('signIn.signUpButton') }}
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
