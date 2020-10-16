module.exports = (app, moduleConfig, { moment, sequential, functions }) =>
    async function saveMainNotice({mainNotice}) {
        return this.withMongodb(async (db, client) => {
            let sequences = []
            sequences.push(() => saveMainNoticeProcedure())
            return await sequential(sequences)
            function saveMainNoticeProcedure() {
                return db
                    .collection('notices')
                    .bulkWrite(
                        [{
                            updateOne: {
                                filter: {
                                    name: "default"
                                },
                                update: {
                                    $setOnInsert: {
                                        created: moment().format('DD-MM-YYYY HH:mm:ss'),
                                    },
                                    $set:{
                                        contents: mainNotice
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