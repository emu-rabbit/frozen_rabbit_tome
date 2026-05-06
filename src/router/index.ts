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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
