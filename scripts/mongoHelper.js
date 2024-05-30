const config = require('config');
const MongoClient = require('mongodb').MongoClient;

class MongoHelper {

    mongoClient;

    constructor() {
        this.mongoClient = null;
    }

    init = async () => {
        this.mongoClient = new MongoClient(config.get('mongodb_uri'));
        let db = await this.mongoClient.connect();
        this.dbo = db.db(config.get('mongodb_database'));
    }

    findAllSymbolsInMyCryptos = async () => {
        try {
            await this.init();
            return await this.dbo.collection("my-cryptos").find({
                ico_address: {$exists: false}
            }, {
                "id": 1
            }).toArray();
        } finally {
            await this.mongoClient.close();
        }
    }

    findAllMyCryptosIco = async () => {
        try {
            await this.init();
            return await this.dbo.collection("my-cryptos").find({ico_address: {$exists: true}}).toArray();
        } finally {
            await this.mongoClient.close();
        }
    }

    findAllSymbolsInCryptosSurvey = async () => {
        try {
            await this.init();
            return await this.dbo.collection("cryptos-survey").find({}, {
                "id": 1
            }).toArray();
        } finally {
            await this.mongoClient.close();
        }
    }

    findMyCrypto = async (id) => {
        try {
            await this.init();
            return await this.dbo.collection("my-cryptos").findOne({id: id});
        } finally {
            await this.mongoClient.close();
        }
    }

    findCryptosSurvey = async (id) => {
        try {
            await this.init();
            return await this.dbo.collection("cryptos-survey").findOne({id: id});
        } finally {
            await this.mongoClient.close();
        }
    }

    findOneAndReplaceInMyCryptos = async (doc) => {
        try {
            await this.init();
            return await this.dbo.collection("my-cryptos").findOneAndReplace({id: doc.id, symbol: doc.symbol}, doc)
        } finally {
            await this.mongoClient.close();
        }
    }

    findOneAndReplaceInCryptosSurvey = async (doc) => {
        try {
            await this.init();
            return await this.dbo.collection("cryptos-survey").findOneAndReplace({id: doc.id}, doc)
        } finally {
            await this.mongoClient.close();
        }
    }

    updateUsdtValueInCurrentFiat = async (value) => {
        try {
            await this.init();
            return await this.dbo.collection("params").findOneAndReplace({id: "usdt"},
                {id: "usdt", value: parseFloat(value)}, {upsert: true})
        } finally {
            await this.mongoClient.close();
        }
    }

    updateAllCoingecko = async (cryptos) => {
        let newCoins = [];
        try {
            let updates = 0;
            let news = 0;
            await this.init();
            for (let crypto in cryptos) {
                let doc = await this.dbo.collection("coingecko").findOneAndReplace({id: cryptos[crypto].id}, cryptos[crypto], {upsert: true});
                if (doc === null) {
                    newCoins.unshift(cryptos[crypto]);
                    ++news
                } else {
                    ++updates
                }
            }
            return {
                updates: updates,
                news: news,
                newCoins: newCoins
            };
        } finally {
            await this.mongoClient.close();
        }
    }

    log = async (key, info) => {
        try {
            await this.init();
            return await this.dbo.collection("log").findOneAndReplace({key: key}, info, {upsert: true})
        } finally {
            await this.mongoClient.close();
        }
    }

    getAlerts = async () => {
        try {
            await this.init();
            return await this.dbo.collection("alerts").find({}).toArray();
        } finally {
            await this.mongoClient.close();
        }
    }

    getAlertsSurvey = async () => {
        try {
            await this.init();
            return await this.dbo.collection("alerts-survey").find({}).toArray();
        } finally {
            await this.mongoClient.close();
        }
    }

    getNotifications = async () => {
        try {
            await this.init();
            return await this.dbo.collection("notifications").find({}).toArray();
        } finally {
            await this.mongoClient.close();
        }
    }

    addOrUpdateNotification = async (notification) => {
        try {
            await this.init();
            return await this.dbo.collection("notifications")
                .findOneAndReplace({type: notification.type, token: notification.token}, notification, {upsert: true});
        } finally {
            await this.mongoClient.close();
        }
    }

    findCryptoNotMonitored = async (id) => {
        try {
            await this.init();
            return await this.dbo.collection("cryptos-not-monitored").findOne({id: id});
        } finally {
            await this.mongoClient.close();
        }
    }

    findCryptoInCoingecko = async (id) => {
        try {
            await this.init();
            return await this.dbo.collection("coingecko").findOne({id: id});
        } finally {
            await this.mongoClient.close();
        }
    }

    getAlertAllCoingecko = async () => {
        try {
            await this.init();
            return await this.dbo.collection("alerts-all-coingecko").findOne({})
        } finally {
            await this.mongoClient.close();
        }
    }

    findOneAndReplaceInCryptosNotMonitored = async (doc) => {
        try {
            await this.init();
            return await this.dbo.collection("cryptos-not-monitored").findOneAndReplace({id: doc.id}, doc)
        } finally {
            await this.mongoClient.close();
        }
    }
}

module.exports = MongoHelper
