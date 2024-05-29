const cron = require('node-cron');
const MongoHelper = require('./scripts/mongoHelper')
const quotation = require('./scripts/quotationFromCoinGecko')
const listed = require('./scripts/listedFromCoinGecko')

let updateQuotation = () => {
    quotation.update().then((result) => {
        new MongoHelper().log("quotation",
            {date: new Date, key: "quotation", info: `${result} quotations updated`})
            .then(() => {
            })
    })
}

updateQuotation();

cron.schedule("*/5 * * * *", () => {
    updateQuotation();
}, {});

let updateCoins = () => {
    listed.update().then((result) => {
        new MongoHelper().log("coins",
            {date: new Date, key: "coins", info: `${result} cryptos updated`})
            .then(() => {
            });
    })
}

updateCoins();

cron.schedule("0 23 * * *", () => {
    updateCoins();
}, {});

