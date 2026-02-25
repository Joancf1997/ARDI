import { defineStore } from 'pinia';
import { UserRole, User } from '@/services/auth.service';
import { ref } from 'vue';
import { userService, CreateUserPayload, UpdateUserPayload } from '@/services/user.service';

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([]);
  const loading = ref(false);
  const submitting = ref(false);
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
      pagination.value = response.pagination;
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch users';
    } finally {
      loading.value = false;
    }
  }

  async function createUser(data: CreateUserPayload): Promise<void> {
    submitting.value = true;
    error.value = null;
    try {
      await userService.create(data);
      await fetchUsers();
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to create user';
      throw err;
    } finally {
      submitting.value = false;
    }
  }

  async function updateUser(id: string, data: UpdateUserPayload): Promise<void> {
    submitting.value = true;
    error.value = null;
    try {
      await userService.update(id, data);
      await fetchUsers();
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to update user';
      throw err;
    } finally {
      submitting.value = false;
    }
  }

  async function deleteUser(id: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await userService.remove(id);
      await fetchUsers();
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to delete user';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    users,
    loading,
    submitting,
    error,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
});
