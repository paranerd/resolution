import { createRouter, createWebHistory } from 'vue-router';
import Timeline from '@/views/Timeline.vue';
import Viewer from '@/views/Viewer.vue';
import Login from '@/views/Login.vue';
import Setup from '@/views/Setup.vue';
import TokenService from '@/services/token';

/**
 * Navigation guard to check for authentication.
 *
 * @param to
 * @param from
 * @param next
 */
function authGuard(to, from, next) {
  if (TokenService.getRefreshToken()) {
    next();
  } else {
    next('/login');
  }
}

const routes = [
  {
    path: '/',
    name: 'timeline',
    component: Timeline,
    meta: {
      title: 'Timeline',
    },
    beforeEnter: authGuard,
  },
  {
    path: '/viewer/:id',
    name: 'viewer',
    component: Viewer,
    meta: {
      title: 'Viewer',
    },
    beforeEnter: authGuard,
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      title: 'Login',
    },
  },
  {
    path: '/setup',
    name: 'setup',
    component: Setup,
    meta: {
      title: 'Setup',
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.afterEach((to) => {
  document.title = `${to.meta.title} | Resolution` || 'Resolution';
});

export default router;
