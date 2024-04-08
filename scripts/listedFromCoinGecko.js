const config = require('config');
const MongoHelper = require('../scripts/mongoHelper');

let getCoinsFromApi = async () => {
    try {
        fetch(config.get('coingecko_coins_uri')).then( (response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                console.log(`Error getting coin currency for url ${url}`);
                console.log(`Error info : ${response.statusText}. ${response.statusMessage}`);
                return {"errorGecko": true};
            }
        });
    } catch (error) {
        console.log(error);
        return {"errorGecko": true};
    }
}
let update = async () => {
    let cryptos = await getCoinsFromApi();
    if (cryptos.errorGecko !== true) {
        return new MongoHelper().updateAllCoingecko(cryptos);
    } else {
        return 0;
    }
}

exports.update = update