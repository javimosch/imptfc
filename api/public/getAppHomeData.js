module.exports = (app, moduleConfig, { moment, functions }) =>
    async function getAppHomeData(params) {



        return this.withMongodb(async(db, client) => {
            let match = await functions().getLastMatch(params)
            let players = match.players || []
            return {
                mainNotice: await db.collection('notices').findOne({
                    name: 'default'
                }),
                options: await functions().getAppSettings(),
                stats: {
                    notGoing: players.reduce((a, v) => a + (v.teamNumber === 0 ? 1 : 0), 0),
                    teamNumbers: [
                        players.reduce((a, v) => a + (v.teamNumber === 1 ? 1 : 0), 0),
                        players.reduce((a, v) => a + (v.teamNumber === 2 ? 1 : 0), 0),
                        players.reduce((a, v) => a + (v.teamNumber === 3 ? 1 : 0), 0),
                        players.reduce((a, v) => a + (v.teamNumber === 4 ? 1 : 0), 0),
                        players.reduce((a, v) => a + (v.teamNumber === 5 ? 1 : 0), 0)
                    ],
                    match
                }
            }
        })
    }