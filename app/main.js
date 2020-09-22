import Home from './pages/Home.vue'
import funql from 'funql-api/client'

let fql = funql(window.location.origin,{
    namespace:"api"
})

fql('getEvents').then(console.log)

const routes = [
    {
        path: '/',
        component: Home
    }
]

const router = new VueRouter({
    routes
})

new Vue({
    name: 'app',
    el: '.app',
    router,
    data() {
        return {}
    },
    created() {}
})
