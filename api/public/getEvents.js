module.exports = (app, config, { moment }) => {
    return async function saveEvent(data) {
        return await this.withMongodb(async (db, client) => {
            let match = {};
            if (data.all !== true) {
                match = {
                    is_draft: data.is_draft === undefined ? false : data.is_draft
                }
            }
            return db
                .collection('events')
                .aggregate([{
                    $match: match
                }, {
                    $project: {
                        title: true,
                        slug: true,
                        body: true,
                    }
                }])
                .toArray()

        });
    }
}