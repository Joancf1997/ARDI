import { defineStore } from 'pinia';
import { UserRole, User } from '@/services/auth.service';
import { ref } from 'vue';
import { userService } from '@/services/user.service';


export const useUserStore = defineStore('user', () => { 
  const users = ref<User[]>([]);
  // const currentUser = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  async function fetchUsers(params?: { role?: UserRole; page?: number; limit?: number }) {
    loading.value = true;
    error.value = null;

    try {
      const response = await userService.getAll(params);
      users.value = response.data;
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch users';
    } finally {
      loading.value = false;
    }
  }



  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers
  };
})  
