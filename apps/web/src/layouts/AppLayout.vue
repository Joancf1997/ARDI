<template>
  <div class="layout">
    <div class="topbar">
      <Menubar :model="menuItems">
        <template #start>
          <div class="logo-container">
            <span class="logo-text">ARDI</span>
          </div>
        </template>
        <template #end>
          <div class="user-section">
            <Button
              :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
              text
              rounded
              @click="toggleTheme"
              aria-label="Toggle Theme"
            />
            <Avatar icon="pi pi-user" size="large" style="background-color: var(--accent-color); color: white" />
            <div class="user-info">
              <span class="user-name">{{ user?.fullName }}</span>
              <span class="user-role">{{ user?.role }}</span>
            </div>
            <Button icon="pi pi-sign-out" text rounded @click="handleLogout" aria-label="Logout" />
          </div>
        </template>
      </Menubar>
    </div>

    <div class="main-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from '@/composables/useTheme';

const router = useRouter();
const authStore = useAuthStore();
const { isDark, toggleTheme } = useTheme();

const user = computed(() => authStore.user);

const menuItems = computed(() => [
  {
    label: 'Chats',
    icon: 'pi pi-comments',
    command: () => router.push('/chats'),
  },
  {
    label: 'Dashboard',
    icon: 'pi pi-chart-bar',
    command: () => router.push('/dashboard'),
  },
  {
    label: 'Users',
    icon: 'pi pi-user',
    command: () => router.push('/users'),
  },
]);

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--topbar-text);
  padding-left: 1rem;
}

.logo-text {
  color: var(--topbar-text);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-right: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  color: var(--topbar-text);
}

.user-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.user-role {
  font-size: 0.75rem;
  opacity: 0.9;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

:deep(.p-menubar) {
  background: var(--topbar-bg);
  border: none;
  border-radius: 0;
}

:deep(.p-menubar .p-menuitem-link) {
  color: var(--topbar-text);
}

:deep(.p-menubar .p-menuitem-link:hover) {
  background: var(--topbar-hover-bg);
}

:deep(.p-button-text) {
  color: var(--topbar-text);
}
</style>
