const ObjectID = require("mongodb").ObjectID;

/**
 *
 * @param {*} app
 * @param {*} config
 * @param {*} helpers
 * @returns
 */
module.exports = (app, config, { moment }) => {
  return async function fetchEventTemplates(data) {
    return this.withMongodb(async (db, client) => {
      return (
        await db
          .collection("event_templates")
          .aggregate([
            {
              $match: {},
            },
            {
              $project: {
                _id: true,
                title: true,
                datetime: true,
                repeat: true,
              },
            },
          ])
          .toArray()
      ).map((item) => {
        item.datetime = moment(item.datetime).format("DD/MM/YYYY HH[h]mm");
        item.repeatLabel = {
          day: "Daily",
          week: "Weekly",
          month: "Monthly",
          single: "Does not repeat",
        }[item.repeat];
        return item;
      });
    });
  };
};
