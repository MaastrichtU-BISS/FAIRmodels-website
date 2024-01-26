<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          FAIRmodels
        </q-toolbar-title>
        
        <q-btn class="q-ml-md q-px-sm" label="Logout" @click="logout" flat dense />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Essential Links
        </q-item-label>
      </q-list>
      <q-item>
        Example content
      </q-item>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { authService } from 'src/utils/auth.service';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const leftDrawerOpen = ref(false)

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const logout = () => {
  authService.logout();
	router.push('/auth/login');
}
</script>
