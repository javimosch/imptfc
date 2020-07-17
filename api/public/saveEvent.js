const ObjectID = require('mongodb').ObjectID

module.exports = (app, config, {moment}) => {
    return async function saveEvent(data) {
        return await this.withMongodb(async(db, client) => {
            let payload = {
                ...data
            }
            delete payload._id
            return db.collection('events').bulkWrite(
                [{
                    updateOne: {
                        filter: {
                            _id: data._id===undefined ? new ObjectID() : new ObjectID(data._id) 
                        },
                        update: {
                            $setOnInsert: {
                                created: moment().format('DD-MM-YYYY HH:mm:ss'),
                            },
                            $set:{
                                is_draft: true,
                                ...payload
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
        })
    }
}