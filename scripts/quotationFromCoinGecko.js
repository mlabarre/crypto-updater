const config = require('config');
const MongoHelper = require('../scripts/mongoHelper');

let getAllSymbols = async () => {
    let list = await new MongoHelper().findAllSymbols();
    let symbols = [];
    await list.forEach((t) => {
        symbols.push(t.id);
    })
    if (!symbols.includes("tether")) {
        symbols.push("tether");
    }
    return symbols.sort();
}

let buildQuotationUrl = (ids) => {
    return `${config.get('coingecko_quotation_uri')}?` +
        `vs_currencies=${config.get('coingecko_currency')}&ids=${ids}`
}
let getQuotationsFromApi = async () => {
    try {
        let symbolList = (await getAllSymbols()).join(",");
        let url = buildQuotationUrl(symbolList);
        fetch(url).then((response) => {
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
    }
}

let update = async () => {
    let updates = 0;
    let currency = config.get('coingecko_currency');
    // { id:, name:, eur: }
    let cryptos = await getQuotationsFromApi();
    if (cryptos.errorGecko !== true) {
        let usdtValue = cryptos["tether"][currency];
        await new MongoHelper().updateUsdtValueInCurrentFiat(usdtValue);
        for (let cryptoId in cryptos) {
            let coin = await new MongoHelper().findMyCrypto(cryptoId);
            if (coin !== null) {
                let crypto = cryptos[coin.id];
                coin["last_five_minutes_quotation"] = coin.quotation === null ? 0 : coin.quotation;
                coin["quotation"] = crypto[currency];
                coin["quotation_usdt"] = crypto[currency] / usdtValue;
                coin["quotation_date"] = new Date();
                coin["last_five_minutes_quotation_date"] = new Date()
                if (coin["last_one_hour_quotation"] !== undefined) {
                    if ((new Date().getTime() - coin["last_one_hour_quotation_date"].getTime()) >= 3600 * 1000) {
                        coin["last_one_hour_quotation_date"] = new Date();
                        coin["last_one_hour_quotation"] = crypto[currency];
                    }
                } else {
                    coin["last_one_hour_quotation_date"] = new Date();
                    coin["last_one_hour_quotation"] = crypto[currency];
                }
                if (coin["last_day_quotation"] !== undefined) {
                    if ((new Date().getTime() - coin["last_day_quotation_date"].getTime()) >= 3600 * 1000 * 24) {
                        coin["last_day_quotation_date"] = new Date();
                        coin["last_day_quotation"] = crypto[currency];
                    }
                } else {
                    coin["last_day_quotation_date"] = new Date();
                    coin["last_day_quotation"] = crypto[currency];
                }
                ++updates;
                console.log(coin)
                await new MongoHelper().findOneAndReplaceInMyCryptos(coin);
            }
        }
    }
    return updates;
}

exports.update = update