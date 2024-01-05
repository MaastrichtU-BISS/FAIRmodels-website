import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/main.vue'),
    children: [{ path: '', component: () => import('pages/index.vue') }],
  },
  
  {
    path: '/auth/login',
    component: () => import('layouts/blank.vue'),
    children: [{
      path: '', component: () => import('pages/auth/login.vue')
    }],
  },
  {
    path: '/auth/register',
    component: () => import('layouts/blank.vue'),
    children: [{
      path: '', component: () => import('pages/auth/register.vue')
    }],
  },
  
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/not-found.vue'),
  },
];

export default routes;
