const {  ObjectID } = require('mongodb');

module.exports = (app, moduleConfig, { lodash, sequential, moment }) =>
    async function savePlayerSlot(form) {

        const matchFilter = {
            _id:{
                $eq: ObjectID(form.eventId)
            }
        }

        return this.withMongodb(async(db, client) => {
            let sequences = []
            sequences.push(() => findAndUpdateOrCreatePlayer())
            sequences.push(() => createMatchIfNotExistAndUpdateMatchPlayers())
            return sequential(sequences)

            async function createMatchIfNotExistAndUpdateMatchPlayers() {
                let playerId = (await db.collection('players').findOne({
                    nickname: form.nickname.toLowerCase()
                }))._id
                return db.collection('matchs').bulkWrite(
                    [/*{
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
                    },*/ {
                        updateOne: {
                            filter: {
                                ...matchFilter,
                                $or:[
                                    {
                                        players: {
                                            $not: {
                                                $elemMatch: {
                                                    player_id: playerId
                                                }
                                            }
                                        }
                                    },
                                    {
                                        players:{
                                            $exists:false
                                        }
                                    }
                                ]
                            },
                            update: {
                                $addToSet: {
                                    players: {
                                        player_id: playerId,
                                        joined: moment()._d.getTime(),
                                        teamNumber: parseInt(form.teamNumber)
                                    }
                                },
                            }
                        }
                    }, {
                        updateOne: {
                            filter: {
                                ...matchFilter,
                                players: {
                                    $elemMatch: {
                                        player_id: playerId
                                    }

                                }
                            },
                            update: {
                                $set: {
                                    "players.$.player_id": playerId,
                                    "players.$.teamNumber": parseInt(form.teamNumber)
                                },
                            }
                        }
                    }], {
                        ordered: true,
                        w: 1
                    }
                )
            }

            function findAndUpdateOrCreatePlayer() {
                return db.collection('players').bulkWrite(
                    [{
                        updateOne: {
                            filter: {
                                nickname: form.nickname.toLowerCase()
                            },
                            update: {
                                $set: lodash.omit({
                                        nickname: form.nickname.toLowerCase(),
                                        ...(!!form.phone && { phone: form.phone.toLowerCase() }),
                                        ...(!!form.email && { email: form.email.toLowerCase() })
                                    },
                                    '_id'
                                )
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