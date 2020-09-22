<template lang="pug">
    .home_page
        ChoiceTeam
</template>
<script>
    import ChoiceTeam from '../components/ChoiceTeam.vue'
    
export default {
    components:{
        ChoiceTeam
    },
    mounted(){
        console.log("MOUNTED")
    }
}
</script>
<style lang="scss">
    body{
        color:red;
    }
</style>