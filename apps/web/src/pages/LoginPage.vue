<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>ARDI</h1>
        <p class="subtitle">Welcome back</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-field">
          <InputText 
            id="email" 
            v-model="email" 
            type="email" 
            placeholder="Enter your email" 
            class="minimal-input"
            required 
          />
        </div>

        <div class="form-field">
          <Password
            id="password"
            v-model="password"
            placeholder="Password"
            :feedback="false"
            toggleMask
            class="minimal-input-password"
            inputClass="minimal-input"
            required
          />
        </div>

        <div v-if="authStore.error" class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          {{ authStore.error }}
        </div>

        <div class="form-actions">
          <Button type="submit" label="Log in" :loading="authStore.loading" class="login-btn" />
        </div>

        <div class="extra-links">
          <a href="#" class="forgot-password">Forgot your password?</a>
          <div class="signup-prompt">
            <span>Don't have an account?</span>
            <a href="#" class="signup-link">Sign Up</a>
          </div>
        </div>

        <div class="demo-credentials">
          <p><strong>Demo:</strong> admin@agent.local / Admin123!</p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  const success = await authStore.login({ email: email.value, password: password.value });

  if (success) {
    router.push('/dashboard');
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center; /* Align card to the left/center-left */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-card {
  background: white;
  width: 100%;
  max-width: 600px;
  padding: 3rem;
  border-radius: 4px; /* Slight rounding or none for cleaner look */
  box-shadow: 0 15px 35px rgba(0,0,0,0.1);
  text-align: center;
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
  color: #333;
  text-transform: uppercase;
}

.subtitle {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 2.5rem;
}

.form-field {
  margin-bottom: 1.5rem;
}

/* Minimal Input Styling */
:deep(.minimal-input) {
  width: 100%;
  border: none;
  border-bottom: 1px solid #ddd;
  border-radius: 0;
  padding: 0.75rem 0;
  font-size: 0.95rem;
  background: transparent;
  transition: border-color 0.3s;
}

:deep(.minimal-input:focus) {
  border-bottom-color: #333;
  box-shadow: none;
}

:deep(.minimal-input::placeholder) {
  color: #aaa;
}

:deep(.p-password), 
:deep(.minimal-input-password) {
  width: 100%;
}

:deep(.p-password-input) {
  width: 100%;
}

.login-btn {
  width: 100%;
  background: #222;
  border: none;
  border-radius: 2rem;
  padding: 0.75rem;
  font-weight: 500;
  margin-top: 1rem;
  transition: background 0.3s;
}

.login-btn:hover {
  background: #000;
}

.extra-links {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.forgot-password {
  color: #888;
  text-decoration: none;
  margin-bottom: 0.5rem;
}

.signup-prompt {
  margin-top: 0.5rem;
}

.signup-link {
  font-weight: 600;
  color: #333;
  text-decoration: none;
  margin-left: 0.25rem;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.demo-credentials {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  font-size: 0.75rem;
  color: #999;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .login-page {
    justify-content: center;
    padding-left: 0;
    padding: 1rem;
  }
  
  .login-card {
    padding: 2rem;
  }
}
</style>
