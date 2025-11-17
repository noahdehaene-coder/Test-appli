
import { createApp } from 'vue'
import App from './App.vue'
import router from './routes.js'
// .use(router) à rajouter après createApp pour utiliser le router
const app = createApp(App)

app.use(router)
app.mount('#app')
