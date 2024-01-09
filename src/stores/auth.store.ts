import { defineStore } from 'pinia';
import { ref } from 'vue';

const BASE_URL = 'localhost:8000/api'

const API = {
  AUTH_REFRESH_TOKEN: `${BASE_URL}/auth/token/refresh`
}

export const useCounterStore = defineStore('auth', () => {
  
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);

  const setTokens = (aToken: string, rToken: string) => {
    accessToken.value = aToken,
    refreshToken.value = rToken
  }

  const refreshAccessToken = () => {
    fetch(API.AUTH_REFRESH_TOKEN, {method: 'POST', body: { refresh: refreshToken.value }})
  }

  return 

});
