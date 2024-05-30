const cron = require('node-cron');
const MongoHelper = require('./scripts/mongoHelper')
const quotation = require('./scripts/quotationFromCoinGecko')
const listed = require('./scripts/listedFromCoinGecko')
const utils = require("./scripts/utils");

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
            {date: new Date, key: "coins", info: `${result.news} new cryptos, ${result.updates} cryptos updated`})
            .then(() => {
                if (result.newCoins.length > 0) {
                    utils.sendNotification(utils.formatNewCoins(result.newCoins), 'New cryptos')
                        .then((res) => {
                    });
                }
            });
    })
}

updateCoins();

cron.schedule("0 23 * * *", () => {
    updateCoins();
}, {});

