module.exports = (app, moduleConfig, { moment, lodash }) => {
    const defaultSettings = [{
            name: 'max_number_of_teams',
            value: 3
        },
        {
            name: 'default_match_date',
            value: moment()
                .day(6)
                .hour(9)
                .minute(0)
                .add(1, 'day')
                ._d.getTime()
        }
    ]
    return async function configure() {
        return await this.withMongodb(async(db, client) => {
            const collection = db.collection('app_settings')

            let bulkWrite = []
            defaultSettings.forEach(item => {
                bulkWrite.push({
                    updateOne: {
                        filter: {
                            name: item.name
                        },
                        update: {
                            $set: lodash.omit(item, '_id')
                        },
                        upsert: true
                    }
                })
            })

            let response = await collection.bulkWrite(bulkWrite)
            return response
        })
    }
}