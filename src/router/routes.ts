import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/auth/login',
    component: () => import('layouts/blank.vue'),
    children: [{
      path: '', component: () => import('pages/auth/login.vue'),
      name: 'auth.login',
    }],
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/auth/register',
    component: () => import('layouts/blank.vue'),
    children: [{
      path: '', component: () => import('pages/auth/register.vue'),
      name: 'auth.register',
    }],
    meta: {
      requiresAuth: false
    }
  },

  {
    path: '/',
    component: () => import('layouts/main.vue'),
    children: [{
      path: '', component: () => import('pages/index.vue'),
      name: 'index'
    }]
  },
  
  {
    path: '/fairmodel/',
    component: () => import('layouts/main.vue'),
    children: [{
      path: '', component: () => import('pages/fairmodel/index.vue'),
      name: 'fairmodel.index',
    }],
  },
  {
    path: '/fairmodel/:fairmodel_id',
    component: () => import('layouts/main.vue'),
    children: [{
      path: '', component: () => import('pages/fairmodel/id.vue'),
    }],
  },
  {
    path: '/fairmodel/:fairmodel_id/version',
    component: () => import('layouts/main.vue'),
    children: [{
      path: '', component: () => import('pages/fairmodel/id.vue'),
    }],
  },
  {
    path: '/fairmodel/:fairmodel_id/version/:version_id',
    component: () => import('layouts/main.vue'),
    children: [{
      path: '', component: () => import('pages/fairmodel/id.vue')
    }],
  },
  
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/not-found.vue'),
  },
];

export default routes;
