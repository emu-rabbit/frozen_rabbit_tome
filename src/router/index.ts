import { createRouter, createWebHistory } from 'vue-router';
import CreateGuide from '../views/CreateGuide.vue';
import Settings from '../views/Settings.vue';

const routes = [
  {
    path: '/',
    name: 'CreateGuide',
    component: CreateGuide,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
