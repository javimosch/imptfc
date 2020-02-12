module.exports = (app, moduleConfig, { moment, functions }) =>
    async function getAppHomeData() {
        return this.withMongodb(async(db, client) => {
            let match = await functions().getLastMatch()

            return {
                options: await functions().getAppSettings(),
                stats: {
                    notGoing: match.players.reduce((a, v) => a + (v.teamNumber === 0 ? 1 : 0), 0),
                    teamNumbers: [
                        match.players.reduce((a, v) => a + (v.teamNumber === 1 ? 1 : 0), 0),
                        match.players.reduce((a, v) => a + (v.teamNumber === 2 ? 1 : 0), 0),
                        match.players.reduce((a, v) => a + (v.teamNumber === 3 ? 1 : 0), 0)
                    ],
                    match
                }
            }
        })
    }