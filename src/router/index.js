import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Monitoring from '@/components/Monitoring.vue'
import MinIO from '@/components/MinIO.vue'
import Dialog from '@/components/Dialog.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/monitoring',
    name: 'monitoring',
    component: Monitoring
  },
  {
    path: '/minio',
    name: 'minio',
    component: MinIO
  },
  {
    path: '/dialog',
    name: 'dialog',
    component: Dialog
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
