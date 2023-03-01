module.exports = (app, moduleConfig, { lodash, sequential, moment }) =>
  async function getLastMatch({ eventDayOfWeek, eventCode }) {
    console.log("getLastMatch", {
      eventCode,
      eventDayOfWeek,
    });

    const eventMatchFilter = {
      date: {
        $gt: moment()._d.getTime(),
      },
      eventDayOfWeek: {
        $eq: eventDayOfWeek,
      },
      eventCode: {
        $eq: eventCode,
      },
      status: {
        $ne: "CANCELED",
      },
    };

    return this.withMongodb(async (db, client) => {
      let sequences = [];

      let res;
      sequences.push(() => createMatchIfNotExistAndUpdateMatchPlayers());
      sequences.push(() =>
        (async () => {
          res = await findLast();
        })()
      );
      await sequential(sequences);

      console.log("getLastMatch sequential res", {
        res,
      });

      //res.splice(0, 1)
      return res instanceof Array && res.length === 1 ? res[0] : res;

      async function findLast() {
        let match = await db.collection("matchs").findOne(eventMatchFilter);

        return (
          (
            await db
              .collection("matchs")
              .aggregate([
                {
                  $match: {
                    ...eventMatchFilter,
                  },
                },
                {
                  $limit: 1,
                },
                {
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
                    "player.joined": "$players.joined",
                  },
                },
                {
                  $project: {
                    _id: 1,
                    date: 1,
                    dayOfWeek: 1,
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
                    _id: true,
                    date: true,
                    players: true,
                  },
                },
              ])
              .toArray()
          )[0] || match
        );
      }
      async function createMatchIfNotExistAndUpdateMatchPlayers() {
        function getNextMatchDate() {
          let cursor = moment();

          //If created on wends, with dayOfWeek equals 0,1 or 2 (Next Sunday)
          if (eventDayOfWeek < cursor.day()) {
            cursor = cursor
              .day(6)
              .add(eventDayOfWeek + 1, "day")
              .hour(8)
              .minute(0);
          } else {
            cursor = cursor
              .day(eventDayOfWeek)
              .hour(8)
              .minute(0);
          }

          return cursor._d.getTime();
        }

        let timestamp = getNextMatchDate();

        let bulkWriteRes = await db.collection("matchs").bulkWrite(
          [
            {
              updateOne: {
                filter: {
                  ...eventMatchFilter,
                },
                update: {
                  $setOnInsert: {
                    created: moment()._d.getTime(),
                    date: timestamp,
                    eventTimestamp: timestamp,
                    eventDatetimeFormatted: moment(timestamp).format(
                      "MM/DD/YYYY HH:mm:ss"
                    ),
                    eventDayOfWeek,
                    eventCode,
                  },
                  $currentDate: { lastModified: true },
                },
                upsert: true,
              },
            },
          ],
          {
            ordered: true,
            w: 1,
          }
        );

        console.log("createMatchIfNotExistAndUpdateMatchPlayers", {
          bulkWriteRes,
        });

        return true;
      }
    });
  };
