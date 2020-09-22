module.exports = async (app, config) => {
    let funql = app.funqlApi

    var helpers = {
	config,
        functions: () => app.api[config.name],
        sequential: require('promise-sequential'),
        lodash: require('lodash'),
        moment: function moment() {
            //return require('moment-timezone').apply(null, arguments)
            let m = require('moment-timezone')
            m.locale(process.env.MOMENT_LOCALE ||'fr')
            return m
                .apply(m, arguments)
                .utc()
                .tz(process.env.MOMENT_TZ || 'Europe/Paris')
               
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
               // if (this.req || this.res) return { err: 401 }
               return true
            }
        ]
    })

    await funql.loadFunctionsFromFolder({
        namespace: config.name,
        path: config.getPath('api/public'),
        params: [app, config, helpers],
        scope: apiScope
    })

    app.get(config.getRouteName('list'),async(req,res)=>{
        if(req.query.pwd!=='secret') res.status(401).send()
        let c = (await require('sander').readFile(config.getPath('list.html'))).toString('utf-8')
        let matches = await app.api[config.name].getMatchesPlayersReport()
        
        let endpoint = process.env.NODE_ENV === 'production' ? `https://edge.savoie.misitioba.com` : 
        ('http://'+req.headers.host.split('http://').join(''))
        
        c = c.split("{{INITIAL_STATE}}").join(JSON.stringify({
            endpoint,
            matches
        },null,4))
        res.send(c)
    })
    
    app.get(
        config.getRouteName('app/app.js'),
        app.webpackMiddleware({
            entry: config.getPath('app/main.js')
        })
    )
    
    
    app.get(config.getRouteName("app"),app.builder.transformFileRoute({
        source: config.getPath('app/index.pug'),
        context: {
            config,
            env: process.env
        }
    }))
    
    
    
    app.use(
        config.getRouteName(),
        require('express').static(config.getPath())
    )
    
    app.get(config.getRouteName('/comments'),(req,res)=>{
        res.sendFile(config.getPath("/comments.html"))
    })
    
    

    app.use(
        config.getRouteName(),
        require('express').static(config.getPath('client/dist'))
    )
    
    
}
