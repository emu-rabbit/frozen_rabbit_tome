import { createRouter, createWebHashHistory } from 'vue-router';
import CreateGuide from '../views/CreateGuide.vue';
import Settings from '../views/Settings.vue';
import GearProfiles from '../views/GearProfiles.vue';
import Solver from '../views/Solver.vue';
import TomeLibrary from '../views/TomeLibrary.vue';
import FavoriteItems from '../views/FavoriteItems.vue';
import CreateExperiment from '../views/CreateExperiment.vue';
import Simulator from '../views/Simulator.vue';
import ExperimentDatabase from '../views/ExperimentDatabase.vue';
import FrontierCollectable from '../views/FrontierCollectable.vue';
import FrontierStudies from '../views/FrontierStudies.vue';
import FAQ from '../views/FAQ.vue';
import Changelog from '../views/Changelog.vue';

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
    path: '/favorite-items',
    name: 'FavoriteItems',
    component: FavoriteItems,
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
    path: '/frontier',
    name: 'FrontierCollectable',
    component: FrontierCollectable,
  },
  {
    path: '/frontier/collectable',
    redirect: '/frontier',
  },
  {
    path: '/frontier/studies',
    name: 'FrontierStudies',
    component: FrontierStudies,
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ,
  },
  {
    path: '/changelog',
    name: 'Changelog',
    component: Changelog,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
  },
  {
    path: '/settings/gear-profiles',
    name: 'GearProfiles',
    component: GearProfiles,
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
