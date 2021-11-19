import { createRouter, createWebHistory } from 'vue-router';
import Timeline from '@/views/Timeline.vue';
import Viewer from '@/views/Viewer.vue';

const routes = [
  {
    path: '/',
    name: 'timeline',
    component: Timeline,
    meta: {
      title: 'Timeline',
    },
  },
  {
    path: '/viewer/:id',
    name: 'viewer',
    component: Viewer,
    meta: {
      title: 'Viewer',
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
