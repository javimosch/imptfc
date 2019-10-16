module.exports = (app, moduleConfig, { lodash, sequential, moment }) =>
    async function savePlayerSlot(form) {
        return this.withMongodb(async(db, client) => {
            let sequences = []
            sequences.push(() => findAndUpdateOrCreatePlayer())
            sequences.push(() => createMatchIfNotExistAndUpdateMatchPlayers())
            return sequential(sequences)

            async function createMatchIfNotExistAndUpdateMatchPlayers() {
                let playerId = (await db.collection('players').findOne({
                    nickname: form.nickname
                }))._id
                return db.collection('matchs').bulkWrite(
                    [{
                        updateOne: {
                            filter: {
                                created: {
                                    $gt: moment()._d.getTime()
                                }
                            },
                            update: {
                                $addToSet: {
                                    players: playerId
                                },
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

            function findAndUpdateOrCreatePlayer() {
                return db.collection('players').bulkWrite(
                    [{
                        updateOne: {
                            filter: {
                                nickname: form.nickname
                            },
                            update: {
                                $set: lodash.omit({
                                        nickname: form.nickname
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