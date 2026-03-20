import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Items from '../views/Items.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: Home },
    { path: '/items', name: 'Items', component: Items },
  ],
})

export default router
