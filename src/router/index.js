import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    redirect: '/ckGraph',
    children: [
      {
        path: '/ckGraph/',
        name: 'ckGraph',
        component: () => import(/* webpackChunkName: "about" */ '../views/ckGraph.vue')
      },
      {
        path: '/view2D',
        name: 'view2D',
        component: () => import(/* webpackChunkName: "about" */ '../views/view2D.vue')
      },
      {
        path: '/dashBoard',
        name: 'dashBoard',
        component: () => import(/* webpackChunkName: "about" */ '../components/dashBoard.vue')
      },
    ]
  },
  // {
  //   path: '/neo4j',
  //   name: 'neo4j',
  //   component: () => import(/* webpackChunkName: "about" */ '../views/Neo4j.vue')
  // },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router