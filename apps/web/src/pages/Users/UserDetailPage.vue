<template>
  <AppLayout>
    <h1> User detail </h1>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user.store';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import AppLayout from '@/layouts/AppLayout.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const toast = useToast();


const dog = computed(() => dogsStore.currentDog);


onMounted(async () => { 
  const id = route.params.id as String;
  try { 
    userStore.fetchUserById(id);
  } catch (error) { 
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load user details', life: 3000 });
    router.push('/users');
  }
})

</script>
