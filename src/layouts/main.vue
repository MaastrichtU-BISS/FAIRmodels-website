<script setup lang="ts">
import { useUserStore } from 'src/stores/user';
import { authService } from 'src/utils/auth.service';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { symOutlinedBugReport } from '@quasar/extras/material-symbols-outlined';

const router = useRouter();
const userStore = useUserStore();

const leftDrawerOpen = ref(false)

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const logout = () => {
  authService.logout();
	router.push('/auth/login');
}
</script>

<template>
  <q-layout view="hHh Lpr lFf">
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
          <router-link to="/">
            <q-btn color="white" label="FAIR4AI" flat size="lg" />
          </router-link>
          <q-btn class="q-ml-xs" flat target="_blank" href="https://github.com/MaastrichtU-BISS/FAIRmodels-website/issues" :icon="symOutlinedBugReport">
            <q-tooltip>
              Report Bug
            </q-tooltip>
          </q-btn>
        </q-toolbar-title>
        
        <q-btn class="q-ml-md q-px-sm" flat dense label="Account">
          <q-menu>
            <q-list style="min-width: 100px">
              <q-item>
                <q-item-section>
                  <q-item-label>{{ userStore.getUser()?.email }}</q-item-label>
                  <q-item-label caption>Logged In</q-item-label>
                </q-item-section>
              </q-item>
              
              <q-separator spaced />

              <q-item color="primary" clickable v-close-popup @click="logout">
                Logout
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
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
          FAIR4AI Navigation
        </q-item-label>
      </q-list>
      <q-item clickable @click="router.push('/fairmodel')">
        FAIRmodels
      </q-item>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>