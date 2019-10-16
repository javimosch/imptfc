module.exports = (app, moduleConfig, { moment, functions }) =>
    async function getAppHomeData() {
        return this.withMongodb(async(db, client) => {
            return {
                options: await functions().getAppSettings(),
                stats: {
                    match: await functions().getLastMatch()
                        // assistances: db.collection('matchs').
                }
            }
        })
    }