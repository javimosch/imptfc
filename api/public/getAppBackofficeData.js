module.exports = (app, moduleConfig, { moment, functions }) =>
    async function getAppBackofficeData() {
        return await functions().getMatchesPlayersReport();
    }