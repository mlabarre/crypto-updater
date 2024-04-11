const config = require('config');
const MongoHelper = require('../scripts/mongoHelper');

let getCoinsFromApi = async () => {
    let response = await fetch(config.get('coingecko_coins_url'));
    if (response.status === 200) {
        return await response.json();
    } else {
        console.log(`Error getting coin currency for url ${config.get('coingecko_coins_url')}`);
        console.log(`Error info : ${response.statusText}. ${response.statusMessage}`);
        return {"errorGecko": true};
    }

}
let update = async () => {
    let updates = 0;
    let cryptos = await getCoinsFromApi();
    if (cryptos.errorGecko !== true) {
        updates = await new MongoHelper().updateAllCoingecko(cryptos);
    }
    return updates;
}

exports.update = update