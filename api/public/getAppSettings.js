module.exports = () => {
    return async function getAppSettings() {
        return await this.withMongodb(async(db, client) => {
            let reduce = (acum = {}, item) => {
                acum[item.name] = item.value
                return acum
            }
            let arr = await db
                .collection('app_settings')
                .find({})
                .toArray()
            return arr.reduce(reduce, {})
        })
    }
}