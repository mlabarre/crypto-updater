const config = require('config');
const MongoHelper = require('../scripts/mongoHelper');

let getCoinsFromApi = async () => {
    try {
        const response = await fetch(config.get('coingecko_coins_uri'));
        return response.json();
    } catch (error) {
        return null;
    }
}
let update = async () => {
    let cryptos = await getCoinsFromApi();
    return new MongoHelper().updateAllCoingecko(cryptos);
}

exports.update = update