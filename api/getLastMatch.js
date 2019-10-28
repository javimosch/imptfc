module.exports = (app, moduleConfig, { lodash, sequential, moment }) =>
    async function getLastMatch(form) {
        return this.withMongodb(async (db, client) => {
            let sequences = []
            sequences.push(() => createMatchIfNotExistAndUpdateMatchPlayers())
            sequences.push(() => findLast())
            let res = await sequential(sequences)
            res.splice(0, 1)
            return res instanceof Array && res.length === 1 ? res[0] : res

            function findLast() {
                return db
                    .collection('matchs')
                    .aggregate([{
                        $match: {
                            date: {
                                $gt: moment()._d.getTime()
                            }
                        }
                    }, {
                        $limit: 1
                    }, {
                        $unwind: {
                            path: "$players"
                        }
                    }, {
                        $addFields: {
                            player: "$players.player_id"
                        }
                    }, {
                        $lookup:
                        {
                            from: "players",
                            localField: "player",
                            foreignField: "_id",
                            as: "player"
                        }
                    }, {
                        $addFields: {
                            "player.teamNumber": "$players.teamNumber"
                        }
                    }, {
                        $project: {
                            _id: 1,
                            date: 1,
                            player: {
                                $arrayElemAt: ["$player", 0]
                            }
                        }
                    }, {
                        $project: {
                            "player._id": 0
                        }
                    }, {
                        $group: {
                            _id: "$_id",
                            players: {
                                $push: "$player"
                            },
                            date: { $first: '$date' }
                        }
                    }, {
                        $project: {
                            _id: false
                        }
                    }])
                    .toArray()
            }
            async function createMatchIfNotExistAndUpdateMatchPlayers() {
                return db.collection('matchs').bulkWrite(
                    [{
                        updateOne: {
                            filter: {
                                date: {
                                    $gt: moment()._d.getTime()
                                }
                            },
                            update: {
                                $setOnInsert: {
                                    created: moment()._d.getTime(),
                                    date: moment()
                                        .day(6)
                                        .add(1, 'day')
                                        .hour(9)
                                        .minute(0)
                                        ._d.getTime()
                                },
                                $currentDate: { lastModified: true }
                            },
                            upsert: true
                        }
                    }], {
                    ordered: true,
                    w: 1
                }
                )
            }
        })
    }