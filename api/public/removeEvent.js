
module.exports = (app, config, {moment}) => {
    return async function removeEvent(data) {

        const ObjectID = require('mongodb').ObjectID

        return await this.withMongodb(async(db, client) => {
            if(!data._id) return false;

            return db.collection('events').bulkWrite(
                [{
                    deleteOne: {
                        filter: {
                            _id: ObjectID(data._id)
                        }
                    }
                }], {
                    ordered: true,
                    w: 1
                }
            )
        })
    }
}