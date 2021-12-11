import { createApp } from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlay,
  faSearch,
  faTimes,
  faUserCircle,
  faGem,
  faDownload,
  faPowerOff,
  faGhost,
  faSyncAlt,
  faTrash,
  faPlayCircle,
  faPauseCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Importing global css files
import '@/assets/style/normalize.css';
import '@/assets/style/reset.scss';
import '@/assets/style/responsive.scss';

library.add(
  faPlay,
  faSearch,
  faTimes,
  faUserCircle,
  faGem,
  faDownload,
  faPowerOff,
  faGhost,
  faSyncAlt,
  faTrash,
  faPlayCircle,
  faPauseCircle
);

createApp(App)
  .use(router)
  .use(store)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app');
