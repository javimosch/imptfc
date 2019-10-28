module.exports = async (app, config) => {
    let funql = app.funqlApi

    var helpers = {
        functions: () => app.api[config.name],
        sequential: require('promise-sequential'),
        lodash: require('lodash'),
        moment: function moment() {
            return require('moment-timezone').apply(null, arguments)
            let m = require('moment-timezone')
            return m
                .apply(m, arguments)
                .utc()
                .tz(process.env.MOMENT_TZ || 'Europe/Paris')
                .locale(process.env.MOMENT_LOCALE || 'fr')
        }
    }

    const apiScope = {
        withMongodb: cb => {
            return app.withMongodb(cb, {
                dbName: config.name
            })
        }
    }

    await funql.loadFunctionsFromFolder({
        namespace: config.name,
        path: config.getPath('api'),
        params: [app, config, helpers],
        scope: apiScope,
        middlewares: [
            async function () {
                if (this.req || this.res) return { err: 401 }
            }
        ]
    })

    await funql.loadFunctionsFromFolder({
        namespace: config.name,
        path: config.getPath('api/public'),
        params: [app, config, helpers],
        scope: apiScope
    })



    app.use(
        config.getRouteName(),
        require('express').static(config.getPath('client/dist'))
    )
}