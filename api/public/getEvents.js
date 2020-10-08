module.exports = (app, config, { moment }) => {
    return async function getEvents(filters = {}) {
        return await this.withMongodb(async (db, client) => {
            let match = {};
            if (filters.all !== true) {
                match = {
                    is_draft: filters.is_draft === undefined ? false : filters.is_draft
                }
            }
            return db
                .collection('events')
                .aggregate([{
                    $match: match
                }, {
                    $project: {
                        title: true,
                        short_description:true,
                        slug: true,
                        body: true,
                    }
                }])
                .toArray()

        });
    }
}