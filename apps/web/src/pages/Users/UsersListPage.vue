<template>
  <AppLayout>
    <div class="dogs-list">
      <div class="header-section flex justify-between items-center mb-4">
        <h1>User Management</h1>
        <Button label="Add New User" icon="pi pi-plus"  />
      </div>
    </div>

    <Card class="mt-4">
      <template #content>
        <div class="filters mb-3">
          <Select
            v-model="selectedRole"
            :options="clientRole"
            optionLabel="label"
            optionValue="value"
            placeholder="Filter by status"
            @change="handleFilterChange"
            class="filter-dropdown"
          />
        </div>
        <DataTable :value="userStore.users" :loading="userStore.loading" paginator :rows="20" stripedRows>
          <Column field="fullName" header="Full Name" sortable></Column>
          <Column field="email" header="Email" sortable></Column>
          <Column field="role" header="Role" sortable></Column>
          <Column header="Actions">
            <template #body="slotProps">
              <div class="action-buttons">
                <Button
                  icon="pi pi-eye"
                  text
                  rounded
                  @click="viewUser(slotProps.data.id)"
                  v-tooltip.top="'View Details'"
                />
                <ToggleSwitch 
                  v-model="slotProps.data.isActive"
                  @change="isActiveChange(slotProps.data)"
                  v-tooltip.top="'User State'"
                  class="ml-2"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  v-tooltip.top="'Delete'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
    <Toast />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { UserRole, User } from '@/services/auth.service';
import { useUserStore } from '@/stores/user.store';
import AppLayout from '@/layouts/AppLayout.vue';

const toast = useToast();
const router = useRouter();
const userStore = useUserStore();

const selectedRole = ref<UserRole | null>(null);
const clientRole = [
  { label: 'All Roles', value: null },
  { label: 'User', value: 'USER' },
  { label: 'Administrator', value: 'ADMIN' },
]

const handleFilterChange = () => { 
  userStore.fetchUsers({ role: selectedRole.value || undefined })
}

const isActiveChange = async (user: User) => { 
  toast.add({ severity: 'info', summary: 'User State Changed', detail: `${user.fullName} is now ${user.isActive ? 'Active' : 'Inactive'}`, life: 3000 });
}

const viewUser = (id: string) => { 
  router.push('/users/' + id);
}

onMounted(() => { 
  userStore.fetchUsers();
})

</script>
