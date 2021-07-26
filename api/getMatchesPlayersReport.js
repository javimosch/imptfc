module.exports = (app, moduleConfig, { lodash, sequential, moment }) =>
  async function getMatchesPlayersReport() {
    return this.withMongodb(async (db, client) => {
      let sequences = [];
      //sequences.push(() => createMatchIfNotExistAndUpdateMatchPlayers())
      sequences.push(() => getRepport());
      let res = await sequential(sequences);

      res = res.map((item) => {
        item.status = item.status || "OK";
        item.dateF = moment(item.date)
          .format("LLLL")
          .toUpperCase();
        item.dateDiff = moment(item.date).diff(moment(), "hours");

        /*	const tabl = {
            			0:"Absense",
            			1:"Equipe 1",
            			2:"Equipe 2",
            			3:"Liste d'attente"
            		};*/

        item.players = item.players
          .map((p) => {
            p.team = {
              "0": "Absense",
              "1": "Team 1",
              "2": "Team 2",
              "3": "Team 3",
              "4": "Team 4",
              "5": "Replacant",
            }[p.teamNumber];
            p.nickname =
              p.nickname.charAt(0).toUpperCase() + p.nickname.substring(1);

            return p;
          })
          .sort((a, b) => {
            if (
              [1, 2].includes(a.teamNumber) &&
              [1, 2].includes(b.teamNumber)
            ) {
              return a.teamNumber === 1 ? -1 : 1;
            } else {
              return a.teamNumber === 0 ? 1 : -1;
            }
          });

        return item;
      });

      return res;

      function getRepport() {
        return db
          .collection("matchs")
          .aggregate([
            /*{
                        $match: {
                            date: {
                                $gt: moment()._d.getTime()
                            },
                            status:{
                                $ne:'CANCELED'
                            }
                        }
                    }, {
                        $limit: 1
                    },*/ {
              $unwind: {
                path: "$players",
              },
            },
            {
              $addFields: {
                player: "$players.player_id",
              },
            },
            {
              $lookup: {
                from: "players",
                localField: "player",
                foreignField: "_id",
                as: "player",
              },
            },
            {
              $addFields: {
                "player.teamNumber": "$players.teamNumber",
              },
            },
            {
              $project: {
                _id: 1,
                date: 1,
                player: {
                  $arrayElemAt: ["$player", 0],
                },
              },
            },
            {
              $project: {
                "player._id": 0,
              },
            },
            {
              $group: {
                _id: "$_id",
                players: {
                  $push: "$player",
                },
                date: { $first: "$date" },
              },
            },
            {
              $project: {
                _id: false,
              },
            },
            {
              $sort: {
                date: -1,
              },
            },
          ])
          .toArray();
      }
    });
  };
