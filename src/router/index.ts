import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { authService } from 'src/utils/auth.service';
import { useUserStore } from 'src/stores/user';
import { User } from 'src/types';
import { Notify } from 'quasar';

export default function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Validating if (atleast) the refreshtoken is (naively) valid
  // Router.beforeEach((to, from, next) => {
  //   if (to.matched.some(record => record.meta.requiresAuth)) {
  //     const refreshToken = jwtService.getRefreshToken();
  //     console.log("refresh", refreshToken)
  //     if (!jwtService.isTokenNaivelyValid(refreshToken)) {
  //       console.log("Session expired")
  //       const $q = useQuasar();
  //       $q.notify("Your session has ended. Please log-in again.");
  //       next({name: 'auth.login'})
  //     } else {
  //       next()
  //     }
  //   } else {
  //     next()
  //   }
  // })

  const userStore = useUserStore();

  Router.beforeEach(async (to, from, next) => {
    if (to.meta.requiresAuth == undefined || to.meta.requiresAuth == true) {
      try {
        const user = await authService.user()
        if (user.status == 200) {
            userStore.setUser(user.data as User)
            return next()
        } else {
          if (user.data.code && ['bad_authorization_header', 'token_not_valid', 'user_not_found'].includes(user.data.code)) {
            authService.logout(); // just to make sure tokens are not dangling in localstorage
            return next('/auth/login');
          } else {
            throw Error("An unknown error occured when fetching user")
          }
        }
      } catch (error) {
        if ((error as Error).name == 'AxiosError') {
          Notify.create({
            message: 'Unable to connect to the server. Please try again later.',
            type: 'negative',
            position: 'center',
            timeout: 0
          })
          return next(Error("AxiosError when trying to retrieve user information"))
        } else {
          return next(Error((error as Error).message))
        }
      }
    } else {
      return next()
    }
  })

  return Router;
};
