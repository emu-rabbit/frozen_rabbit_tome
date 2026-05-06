import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';
import './style.css';
import App from './App.vue';
import router from './router';
import { i18n } from './i18n';
const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.dark',
        }
    }
});
app.use(i18n);
app.use(router);
app.mount('#app');
//# sourceMappingURL=main.js.map