import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/main.vue'),
    children: [{
      path: '', component: () => import('pages/index.vue'),
      name: 'index'
    }],
    meta: {
      requiresAuth: true
    }
  },
  
  {
    path: '/auth/login',
    component: () => import('layouts/blank.vue'),
    children: [{
      path: '', component: () => import('pages/auth/login.vue'),
      name: 'auth.login',
    }],
  },
  {
    path: '/auth/register',
    component: () => import('layouts/blank.vue'),
    children: [{
      path: '', component: () => import('pages/auth/register.vue'),
      name: 'auth.register',
    }],
  },
  
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/not-found.vue'),
  },
];

export default routes;
