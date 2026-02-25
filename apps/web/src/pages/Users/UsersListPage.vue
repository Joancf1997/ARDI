<template>
  <AppLayout>
    <div class="dashboard">

      <!-- Header -->
      <div class="page-header">
        <div class="header-info">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Manage platform users</p>
        </div>
        <Button
          label="New User"
          icon="pi pi-plus"
          @click="openCreateDialog"
        />
      </div>

      <!-- Filters -->
      <Card class="table-card">
        <template #content>
          <div class="filters mb-3">
            <Select
              v-model="selectedRole"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by role"
              @change="handleFilterChange"
              class="filter-dropdown"
            />
          </div>

          <!-- User Table -->
          <DataTable
            :value="userStore.users"
            :loading="userStore.loading"
            paginator
            :rows="20"
            stripedRows
            dataKey="id"
          >
            <template #empty>
              <div class="empty-state">
                <i class="pi pi-users empty-icon" />
                <p>No users found</p>
              </div>
            </template>

            <Column field="fullName" header="Full Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="role" header="Role" sortable>
              <template #body="{ data }">
                <Tag
                  :value="data.role"
                  :severity="data.role === 'ADMIN' ? 'warn' : 'info'"
                />
              </template>
            </Column>
            <Column header="Active">
              <template #body="{ data }">
                <Tag
                  :value="data.isActive ? 'Active' : 'Inactive'"
                  :severity="data.isActive ? 'success' : 'danger'"
                />
              </template>
            </Column>
            <Column field="createdAt" header="Created" sortable>
              <template #body="{ data }">
                {{ formatDate(data.createdAt) }}
              </template>
            </Column>
            <Column header="Actions" style="width: 8rem">
              <template #body="{ data }">
                <div class="action-buttons">
                  <Button
                    icon="pi pi-pencil"
                    variant="text"
                    severity="contrast"
                    rounded
                    @click="openEditDialog(data)"
                    v-tooltip.top="'Edit User'"
                  />
                  <Button
                    icon="pi pi-trash"
                    variant="text"
                    rounded
                    severity="danger"
                    v-tooltip.top="'Delete User'"
                    @click="confirmDelete(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Create / Edit Dialog -->
      <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? 'Edit User' : 'New User'"
        modal
        :style="{ width: '480px' }"
        :closable="!userStore.submitting"
        @hide="resetForm"
      >
        <form @submit.prevent="submitForm" class="user-form" novalidate>

          <!-- Full Name -->
          <div class="field">
            <label for="fullName" class="field-label">Full Name <span class="required">*</span></label>
            <InputText
              id="fullName"
              v-model.trim="form.fullName"
              placeholder="Jane Doe"
              class="w-full"
              :invalid="!!errors.fullName"
            />
            <small v-if="errors.fullName" class="field-error">{{ errors.fullName }}</small>
          </div>

          <!-- Email -->
          <div class="field">
            <label for="email" class="field-label">Email <span class="required">*</span></label>
            <InputText
              id="email"
              v-model.trim="form.email"
              type="email"
              placeholder="jane@example.com"
              class="w-full"
              :invalid="!!errors.email"
            />
            <small v-if="errors.email" class="field-error">{{ errors.email }}</small>
          </div>

          <!-- Password (create only) -->
          <div class="field" v-if="!isEditMode">
            <label for="password" class="field-label">Password <span class="required">*</span></label>
            <Password
              id="password"
              v-model="form.password"
              placeholder="Min. 8 characters"
              class="w-full"
              :feedback="true"
              toggleMask
              :invalid="!!errors.password"
              inputClass="w-full"
            />
            <small v-if="errors.password" class="field-error">{{ errors.password }}</small>
          </div>

          <!-- Role -->
          <div class="field">
            <label for="role" class="field-label">Role <span class="required">*</span></label>
            <Select
              id="role"
              v-model="form.role"
              :options="roleOptions.slice(1)"
              optionLabel="label"
              optionValue="value"
              placeholder="Select role"
              class="w-full"
              :invalid="!!errors.role"
            />
            <small v-if="errors.role" class="field-error">{{ errors.role }}</small>
          </div>

          <!-- Active Toggle -->
          <div class="field field-toggle">
            <label class="field-label">Active</label>
            <ToggleSwitch v-model="form.isActive" />
          </div>

          <!-- Footer -->
          <div class="form-footer">
            <Button
              label="Cancel"
              severity="secondary"
              variant="text"
              :disabled="userStore.submitting"
              @click="dialogVisible = false"
            />
            <Button
              :label="isEditMode ? 'Save Changes' : 'Create User'"
              type="submit"
              :loading="userStore.submitting"
              icon="pi pi-check"
            />
          </div>
        </form>
      </Dialog>

      <!-- Delete Confirmation -->
      <ConfirmDialog />
      <Toast />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { UserRole, User } from '@/services/auth.service';
import { useUserStore } from '@/stores/user.store';
import AppLayout from '@/layouts/AppLayout.vue';

const userStore = useUserStore();
const confirm = useConfirm();
const toast = useToast();

// ── Filters ──────────────────────────────────────────────────────────────────
const selectedRole = ref<UserRole | null>(null);
const roleOptions = [
  { label: 'All Roles', value: null },
  { label: 'User', value: 'USER' },
  { label: 'Administrator', value: 'ADMIN' },
];

const handleFilterChange = () => {
  userStore.fetchUsers({ role: selectedRole.value || undefined });
};

// ── Dialog state ─────────────────────────────────────────────────────────────
const dialogVisible = ref(false);
const isEditMode = ref(false);
const editingUserId = ref<string | null>(null);

interface FormState {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}

const form = reactive<FormState>({
  fullName: '',
  email: '',
  password: '',
  role: 'USER',
  isActive: true,
});

const errors = reactive<Partial<Record<keyof FormState, string>>>({});

const resetForm = () => {
  form.fullName = '';
  form.email = '';
  form.password = '';
  form.role = 'USER';
  form.isActive = true;
  Object.keys(errors).forEach((k) => delete errors[k as keyof FormState]);
  isEditMode.value = false;
  editingUserId.value = null;
};

const openCreateDialog = () => {
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = (user: User) => {
  resetForm();
  isEditMode.value = true;
  editingUserId.value = user.id;
  form.fullName = user.fullName;
  form.email = user.email;
  form.role = user.role;
  form.isActive = user.isActive;
  dialogVisible.value = true;
};

// ── Validation ────────────────────────────────────────────────────────────────
const validate = (): boolean => {
  Object.keys(errors).forEach((k) => delete errors[k as keyof FormState]);
  let valid = true;

  if (!form.fullName) {
    errors.fullName = 'Full name is required';
    valid = false;
  }
  if (!form.email) {
    errors.email = 'Email is required';
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
    valid = false;
  }
  if (!isEditMode.value) {
    if (!form.password) {
      errors.password = 'Password is required';
      valid = false;
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      valid = false;
    }
  }
  if (!form.role) {
    errors.role = 'Role is required';
    valid = false;
  }

  return valid;
};

// ── Submit ────────────────────────────────────────────────────────────────────
const submitForm = async () => {
  if (!validate()) return;

  try {
    if (isEditMode.value && editingUserId.value) {
      await userStore.updateUser(editingUserId.value, {
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
      });
      toast.add({ severity: 'success', summary: 'User Updated', detail: `${form.fullName} has been updated.`, life: 3000 });
    } else {
      await userStore.createUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        isActive: form.isActive,
      });
      toast.add({ severity: 'success', summary: 'User Created', detail: `${form.fullName} has been created.`, life: 3000 });
    }
    dialogVisible.value = false;
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: userStore.error || 'Something went wrong', life: 4000 });
  }
};

// ── Delete ────────────────────────────────────────────────────────────────────
const confirmDelete = (user: User) => {
  confirm.require({
    message: `Are you sure you want to delete ${user.fullName}? This action cannot be undone.`,
    header: 'Delete User',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await userStore.deleteUser(user.id);
        toast.add({ severity: 'success', summary: 'Deleted', detail: `${user.fullName} has been removed.`, life: 3000 });
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: userStore.error || 'Failed to delete user', life: 4000 });
      }
    },
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => userStore.fetchUsers());
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-title {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  font-weight: 700;
}

.page-subtitle {
  margin: 0;
  opacity: 0.6;
  font-size: 0.9rem;
}

/* Table card */
.table-card {
  border-radius: 12px;
}

.filter-dropdown {
  min-width: 180px;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  opacity: 0.5;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

/* Form */
.user-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-toggle {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
}

.required {
  color: var(--p-red-500);
}

.field-error {
  color: var(--p-red-500);
  font-size: 0.8rem;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--p-surface-200);
}
</style>