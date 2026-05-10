import { createRouter, createWebHashHistory } from 'vue-router';
import CreateGuide from '../views/CreateGuide.vue';
import Settings from '../views/Settings.vue';
import Solver from '../views/Solver.vue';
import TomeLibrary from '../views/TomeLibrary.vue';
import CreateExperiment from '../views/CreateExperiment.vue';
import Simulator from '../views/Simulator.vue';
import ExperimentDatabase from '../views/ExperimentDatabase.vue';
import FAQ from '../views/FAQ.vue';

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
    path: '/library',
    name: 'TomeLibrary',
    component: TomeLibrary,
  },
  {
    path: '/experiment',
    name: 'CreateExperiment',
    component: CreateExperiment,
  },
  {
    path: '/simulator',
    name: 'Simulator',
    component: Simulator,
  },
  {
    path: '/experiment-database',
    name: 'ExperimentDatabase',
    component: ExperimentDatabase,
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ,
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
