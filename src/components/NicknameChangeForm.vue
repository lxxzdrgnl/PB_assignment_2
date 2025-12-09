<script setup lang="ts">
import { ref } from 'vue'
import { updateNickname } from '@/utils/auth'

interface Emits {
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

const nickname = ref('')
const error = ref('')
const success = ref(false)

const handleSubmit = () => {
  error.value = ''

  updateNickname(
    nickname.value,
    () => {
      success.value = true
      setTimeout(() => {
        emit('close')
        // 페이지 새로고침하여 닉네임 업데이트 반영
        window.location.reload()
      }, 1000)
    },
    (message) => {
      error.value = message
    }
  )
}
</script>

<template>
  <div class="nickname-form">
    <div v-if="success" class="success-message">
      <i class="fas fa-check-circle"></i>
      닉네임이 변경되었습니다!
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="nickname">새 닉네임</label>
        <input
          id="nickname"
          type="text"
          v-model="nickname"
          placeholder="새로운 닉네임을 입력하세요"
          class="form-input"
          :class="{ error: error }"
          required
        />
        <p v-if="error" class="error-text">{{ error }}</p>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="emit('close')">취소</button>
        <button type="submit" class="btn btn-primary">변경</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.nickname-form {
  padding: 1.5rem;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #4ade80;
  font-size: 1.1rem;
  justify-content: center;
}

.success-message i {
  font-size: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-dark);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-input.error {
  border-color: #ef4444;
}

.error-text {
  margin-top: 0.5rem;
  color: #ef4444;
  font-size: 0.85rem;
  margin-bottom: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #b20710;
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--bg-light);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--border-color);
}
</style>
