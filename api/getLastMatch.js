module.exports = (app, moduleConfig, { lodash, sequential, moment }) =>
    async function getLastMatch(form) {
        return this.withMongodb(async(db, client) => {
            let sequences = []
            sequences.push(() => createMatchIfNotExistAndUpdateMatchPlayers())
            sequences.push(() => findLast())
            return (await sequential(sequences))[1]

            async function findLast() {
                return (await db
                    .collection('matchs')
                    .find({
                        $gt: moment()._d.getTime()
                    })
                    .limit(1))[0]
            }
            async function createMatchIfNotExistAndUpdateMatchPlayers() {
                return db.collection('matchs').bulkWrite(
                    [{
                        updateOne: {
                            filter: {
                                created: {
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