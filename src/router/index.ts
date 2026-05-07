import { createRouter, createWebHashHistory } from 'vue-router';
import CreateGuide from '../views/CreateGuide.vue';
import Settings from '../views/Settings.vue';
import Solver from '../views/Solver.vue';

const routes = [
  {
    path: '/',
    name: 'CreateGuide',
    component: CreateGuide,
  },
  {
    path: '/solver',
    name: 'Solver',
    component: Solver,
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
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
