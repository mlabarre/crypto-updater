const cron = require('node-cron');
const MongoHelper = require('./scripts/mongoHelper')
const quotation = require('./scripts/quotationFromCoinGecko')
const listed = require('./scripts/listedFromCoinGecko')
const utils = require("./scripts/utils");
const config = require('config');

let updateQuotation = () => {
    let msg = config.language === "fr" ? "cotations mises à jour" : "quotations updated"
    quotation.update().then((result) => {
        new MongoHelper().log("quotation",
            {date: new Date, key: "quotation", info: `${result} ${msg}`})
            .then(() => {
            })
    })
}

updateQuotation();

cron.schedule("*/5 * * * *", () => {
    updateQuotation();
}, {});

let updateCoins = () => {
    let msg1 = config.language === "fr" ? "Nouvelles cryptos" : "New cryptos";
    let msg2 = config.language === "fr" ? "cryptos mises à jour" : "cryptos updated";
    listed.update().then((result) => {
        new MongoHelper().log("coins",
            {date: new Date, key: "coins", info: `${result.news} ${msg1.toLowerCase()}, ${result.updates} ${msg2}`})
            .then(() => {
                if (result.newCoins.length > 0) {
                    utils.sendNotification(utils.formatNewCoins(result.newCoins), msg1)
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

