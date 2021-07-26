const ObjectID = require("mongodb").ObjectID;

/**
 *
 * @param {*} app
 * @param {*} config
 * @param {*} helpers
 * @returns
 */
module.exports = (app, config, { moment }) => {
  return async function saveEventTemplate(data) {
    return this.withMongodb(async (db, client) => {
      let payload = {
        ...data,
      };
      delete payload._id;
      return db.collection("event_templates").bulkWrite(
        [
          {
            updateOne: {
              filter: {
                _id:
                  data._id === undefined
                    ? new ObjectID()
                    : new ObjectID(data._id),
              },
              update: {
                $setOnInsert: {
                  created: moment().format("DD-MM-YYYY HH:mm:ss"),
                },
                $set: {
                  ...payload,
                  datetime: moment(
                    `${payload.date} ${payload.time}`,
                    `YYYY-MM-DD HH:mm`
                  )._d,
                },
                $currentDate: { lastModified: true },
              },
              upsert: true,
            },
          },
        ],
        {
          ordered: true,
          w: 1,
        }
      );
    });
  };
};
