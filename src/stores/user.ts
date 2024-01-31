import { defineStore } from 'pinia';
import { User } from 'src/types';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const user = ref<User>();

  const getUser = () => {
    return user.value
  }

  const setUser = (_user: User) => {
    return user.value = _user;
  }

  return {
    getUser,
    setUser
  }
});
