const ObjectID = require("mongodb").ObjectID;

/**
 *
 * @param {*} app
 * @param {*} config
 * @param {*} helpers
 * @returns
 */
module.exports = (app, config, { moment }) => {
  return async function fetchEventTemplateById(id) {
    return this.withMongodb(async (db) => {
      console.log("fetchEventTemplateById", id);
      return (
        (await db.collection("event_templates").findOne({
          _id: require("mongodb").ObjectID(id),
        })) || {}
      );
    });
  };
};
