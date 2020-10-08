 <template>
  <table>
    
    <thead>
      <tr>
        <th>Surnom</th>
        <th>Équipe</th>
      </tr>
    </thead>
    
    <tbody>
      
      <tr v-for="item in data" :key="item.id">
        <td v-text="item.nickname"></td>
        <td v-text="item.teamNumberFormatted"></td>
      </tr>
      
    </tbody>
      

  <!-- Aucune donnée pour l'instant -->
    
  </table>
</template>
<script>
export default {
  props:['data'],
  name: "TeamList",
  computed:{
    isEmpty(){
      return (this.data && this.data.length===0) ? true : false
    }
  },
  data() {
    return {
      
    };
  }
};
</script>
<style scoped>
</style>