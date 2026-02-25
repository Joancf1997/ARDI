import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService, type User, type LoginCredentials } from '@/services/auth.service';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
  const userRole = computed(() => user.value?.role || null);

  async function login(credentials: LoginCredentials) {
    loading.value = true;
    error.value = null;

    try {
      const token = await authService.login(credentials);
      accessToken.value = token;

      // Fetch user data
      await fetchCurrentUser();

      return true;
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Login failed';
      accessToken.value = null;
      user.value = null;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function refreshAccessToken() {
    try {
      const token = await authService.refresh();
      accessToken.value = token;
    } catch (err) {
      // Refresh failed, clear state
      accessToken.value = null;
      user.value = null;
      throw err;
    }
  }

  async function logout() {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      accessToken.value = null;
      user.value = null;
    }
  }

  async function fetchCurrentUser() {
    try {
      user.value = await authService.getCurrentUser();
    } catch (err) {
      console.error('Fetch user error:', err);
      throw err;
    }
  }

  async function initialize() {
    // Try to refresh token on app load
    try {
      await refreshAccessToken();
      await fetchCurrentUser();
    } catch (err) {
      // No valid session, user needs to login
      accessToken.value = null;
      user.value = null;
    }
  }

  return {
    accessToken,
    user,
    loading,
    error,
    isAuthenticated,
    userRole,
    login,
    logout,
    refreshAccessToken,
    fetchCurrentUser,
    initialize,
  };
});
