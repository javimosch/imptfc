<template>
  <div class="ChoiceTeam">
    <div class="container is-fluid">
      

    <div class="columns is-multiline is-mobile is-centered">
        <div class="column is-half-desktop">
           <div class="notification alert"
            style="margin-bottom:20px;"
            type="is-warning"
            aria-close-label="Close notification"
          >
        PROCHAIN MATCH (HEBDOMADAIRE) : {{dateFormatted}}
           </div>
        </div>
      </div>
     

  <div
        class="notification"
      >Indiquez votre présence en vous inscrivant à une équipe chaque semaine (avant le dimanche!)</div>

      <div class="columns is-multiline is-mobile is-centered">
        <div class="column is-full-mobile is-half-table is-half-desktop">
          <div>
            
            <label>Ton surnom</label>
            <input v-model="form.nickname"/>
            
            
            <label>Ton portable</label>
            <input placeholder="En cas d'urgence ou de changement de terrain"  v-model="form.phone"/>
            
          </div>
          <hr />
          <p class="is-size-6 subtitle" style="margin-top:20px;">Cliquez sur l'un des boutons</p>

          <div class="buttons is-centered">
            
            <button
              type="is-success"
              @click="savePlayerSlot(1)"
            >Équipe 1 ({{stats.teamNumbers[0]}})</button>


            <button type="is-info" @click="savePlayerSlot(2)">Équipe 2 ({{stats.teamNumbers[1]}})</button>

            <button
              type="is-danger"
              @click="savePlayerSlot(3)"
            >Remplaçant ({{stats.teamNumbers[2]}})</button>

            <button type="is-default" @click="savePlayerSlot(0)">Absence ({{stats.notGoing}})</button>

          </div>
        </div>

        <div class="column is-full-mobile is-half-table is-half-desktop">
          <team-list :data="formattedData" />
          <div class="notification">Il y a {{goingCount}} joueurs qui vont au prochain match</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import funql from "funql-api/client";
import TeamList from "./TeamList.vue";



export default {
  components: {
    TeamList
  },
  name: "ChoiceTeam",
  data() {
    return {
      fql:null,
      options: {
        max_number_of_teams: 3
      },
      stats: {
        teamNumbers: [0, 0, 0],
        match: {
          players: []
        }
      },
      form: {
        nickname: "",
        phone:'',
        teamNumber: 0
      }
    };
  },
  async created() {
    this.fql = funql(window.location.origin,{
      ns: window.appName
    })
    console.log('created',window.appName)
    this.update();
  },
  computed: {
    dateFormatted() {
      return require("moment-timezone")(this.stats.match.date)
        .tz("Europe/Paris")
        .utc()
        .locale("fr")
        .calendar();
      //.format('dddd DD-MM-YYYY HH[h]mm')
    },
    goingCount() {
      return this.stats.match.players.filter(p => p.teamNumber !== 0).length;
    },
    formattedData() {

      let teamLabels = {
        "1" : "Equipe 1",
        "2" : "Equipe 2",
        "3" : "Remplaçant"
      }

      let players = this.stats.match.players.map(p => {
        p.nickname = p.nickname.charAt(0).toUpperCase() + p.nickname.substr(1);
        p.teamNumberFormatted = p.teamNumber === 0 ? "Absence" : teamLabels[p.teamNumber.toString()];
        return p;
      });
      let playersMissingTheMatch = players.filter(p => p.teamNumber === 0);
      players = players
        .filter(p => p.teamNumber !== 0)
        .sort((a, b) => {
          return a.teamNumber > b.teamNumber ? 1 : -1;
        });
      return players.concat(playersMissingTheMatch);
    }
  },
  methods: {
    async update() {
      Object.assign(this.$data, await this.fql("getAppHomeData"));
    },
    getActivePlayersLength(){
      return this.stats.match.players.filter(p=>![0,3].includes(p.teamNumber)).length
    },
    isCurrentSubcriberNew(){
      return this.stats.match.players.filter(p=>p.nickname == this.form.nickname).length == 0
    },
    async savePlayerSlot(teamNumber) {
      
  if(this.getActivePlayersLength()>=16 && this.isCurrentSubcriberNew() && teamNumber !== 0){
    this.$buefy.toast.open({
      message: "Au-delà des 16 joueurs, vous serez inscrit comme remplaçant.",
      type: "is-info",
      duration: 5000
    })
    teamNumber = 3 //3 => remplaçant
  }

  var wantsToPlay = ![0,3].includes(teamNumber);

  if(this.getActivePlayersLength()>=16 && !this.isCurrentSubcriberNew() && wantsToPlay){
     return this.$buefy.toast.open({
      message: "Il y a déjà 16 joueurs sur le terrain.",
      type: "is-info",
      duration: 5000
    })
  }

  if (!this.form.nickname) {
        return this.$buefy.toast.open({
          message: "D'abord, écrivez votre nom",
          type: "is-warning"
        });
      }
      await this.fql("savePlayerSlot", {
        ...this.form,
        teamNumber
      });

      this.$buefy.toast.open({
        message: "Est prêt!",
        type: "is-info"
      });
      this.update();

      this.form.nickname = "";
      this.form.phone = "";

    }
  }
};
</script>
<style lang="scss" scoped>
.ChoiceTeam {
  padding: 20px;
}
</style>
