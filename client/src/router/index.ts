import {
  createRouter,
  createWebHistory,
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteRecordRaw,
} from 'vue-router';
import Timeline from '@/views/TimelineView.vue';
import Viewer from '@/views/MediaViewer.vue';
import Login from '@/views/LoginPage.vue';
import Setup from '@/views/SetupPage.vue';
import TokenService from '@/services/token';

/**
 * Navigation guard to check for authentication.
 *
 * @param to
 * @param from
 * @param next
 */
function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (TokenService.getRefreshToken()) {
    next();
  } else {
    next('/login');
  }
}

/**
 * Navigation guard to redirect away from login if logged in.
 *
 * @param to
 * @param from
 * @param next
 */
function doubleLoginGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (TokenService.getRefreshToken()) {
    next('/');
  } else {
    next();
  }
}

const routes: Array<RouteRecordRaw> = [
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
    beforeEnter: doubleLoginGuard,
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
