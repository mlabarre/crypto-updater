const config = require('config');
const MongoHelper = require('../scripts/mongoHelper');

const getCoinsFromApi = async () => {
    let response = await fetch(config.get('coingecko_coins_url'));
    if (response.status === 200) {
        return await response.json();
    } else {
        console.log(`Error getting coin currency for url ${config.get('coingecko_coins_url')}`);
        console.log(`Error info : ${response.statusText}. ${response.statusMessage}`);
        return {"errorGecko": true};
    }

}
const update = async () => {
    let result = {};
    let cryptos = await getCoinsFromApi();
    if (cryptos.errorGecko !== true) {
        result = await new MongoHelper().updateAllCoingecko(cryptos);
    }
    return result;
}

exports.update = update