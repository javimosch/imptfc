module.exports = async (app, config) => {
    var helpers = {
        config,
        functions: () => app.api[config.name],
        sequential: require('promise-sequential'),
        lodash: require('lodash'),
        moment: function moment() {
            //return require('moment-timezone').apply(null, arguments)
            let m = require('moment-timezone')
            m.locale(process.env.MOMENT_LOCALE || 'fr')
            return m
                .apply(m, arguments)
                .utc()
                .tz(process.env.MOMENT_TZ || 'Europe/Paris')

        }
    }

    const apiScope = {
        withMongodb: cb => {
            return app.withMongodb(cb, {
                dbName: process.env.IMPTFC_DB || config.name
            })
        }
    }

    await app.funqlApi.loadFunctionsFromFolder({
        namespace: config.name,
        path: config.getPath('api'),
        params: [app, config, helpers],
        scope: apiScope,
        middlewares: [
            async function () {
                // if (this.req || this.res) return { err: 401 }
                return true
            }
        ]
    })

    await app.funqlApi.loadFunctionsFromFolder({
        namespace: config.name,
        path: config.getPath('api/public'),
        params: [app, config, helpers],
        middlewares: [async () => {
            console.log("MIDDLEWARE")
        }],
        scope: apiScope
    })

    app.get(config.getRouteName('list'), async (req, res) => {
        if (req.query.pwd !== 'secret') res.status(401).send()
        let c = (await require('sander').readFile(config.getPath('list.html'))).toString('utf-8')
        let matches = await app.api[config.name].getMatchesPlayersReport()
	let protocol = req.headers.host.indexOf("localhost")!==-1 ? "http://" : "https://"
        c = c.split("{{INITIAL_STATE}}").join(JSON.stringify({
            mainNotice: await apiScope.withMongodb(async db=>{
                let notice = await db.collection('notices').findOne({
                    name: 'default'
                })
                return notice && notice.contents || ""
            }),
            endpoint:  protocol + req.headers.host.split(protocol).join(''),
            matches
        }, null, 4))
        res.send(c)
    })
}
