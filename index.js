const path = require('path')
const express = require('express')
const app = express()
const funqlApi = require('funql-api')
const port = process.env.PORT || 3000
const config = {  
  name:'imptfc',
  getPath(subPath){
    return path.join(process.cwd(),subPath)
  },
  getRouteName(name){
    return `/${name}`
  }
}

app.funqlApi = funqlApi

createRoutes(app, config).then(() => {

  app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
  })

})



async function createRoutes(app, config) {
  /**
   * This helpers will be injected in the funql functions
   */
  const helpers = {
    config,
    functions: () => app.api[config.name],
    sequential: require("promise-sequential"),
    lodash: require("lodash"),
    moment: function moment() {
      let m = require("moment-timezone");
      m.locale(process.env.MOMENT_LOCALE || "fr");
      return m
        .apply(m, arguments)
        .utc()
        .tz(process.env.MOMENT_TZ || "Europe/Paris");
    },
  };

  /**
   * funql functions scope
   */
  const apiScope = {
    withMongodb: (cb) => {
      return app.withMongodb(cb, {
        dbName: process.env.IMPTFC_DB || config.name,
      });
    },
  };

  /**
   * Load funql functions from api folder
   *
   * @todo: Enforce security
   */
  await app.funqlApi.loadFunctionsFromFolder({
    namespace: config.name,
    path: config.getPath("api"),
    params: [app, config, helpers],
    scope: apiScope,
  });

  /**
   * Load funql functions from api/public folder
   */
  await app.funqlApi.loadFunctionsFromFolder({
    namespace: config.name,
    path: config.getPath("api/public"),
    params: [app, config, helpers],
    scope: apiScope,
  });

  /**
   * Load funql functions from api/admin folder
   *
   * @todo: Enforce security
   */
  await app.funqlApi.loadFunctionsFromFolder({
    namespace: config.name,
    path: config.getPath("api/admin"),
    params: [app, config, helpers],
    scope: apiScope,
  });

  // /admin?pwd=secret route (Administration page)
  app.get(config.getRouteName("admin"), async (req, res) => {
    if (req.query.pwd !== "secret") res.status(401).send();
    let c = (
      await require("sander").readFile(config.getPath("admin.html"))
    ).toString("utf-8");
    let matches = await app.api[config.name].getMatchesPlayersReport();
    let protocol =
      req.headers.host.indexOf("localhost") !== -1 ? "http://" : "https://";
    c = c.split("__INITIAL_STATE__").join(
      JSON.stringify(
        {
          mainNotice: await apiScope.withMongodb(async (db) => {
            let notice = await db.collection("notices").findOne({
              name: "default",
            });
            return (notice && notice.contents) || "";
          }),
          endpoint: protocol + req.headers.host.split(protocol).join(""),
          matches,
        },
        null,
        4
      )
    );
    res.send(c);
  });

  // Redirect old admin page (/list)
  app.get(config.getRouteName("list"), async (req, res) => {
    res.redirect(`${config.getRouteName("admin")}?pwd=${req.query.pwd}`);
  });

  app.use(config.getRouteName("/"), express.static(config.getPath("public")));
};
