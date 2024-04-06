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

    findAllSymbols = async () => {
        try {
            await this.init();
            return await this.dbo.collection("my-cryptos").find({}, {
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

    findOneAndReplaceInMyCryptos = async (doc) => {
        try {
            await this.init();
            return await this.dbo.collection("my-cryptos").findOneAndReplace({id: doc.id}, doc)
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
        try {
            let updates = 0;
            await this.init();
            for (let crypto in cryptos) {
                console.log(cryptos[crypto])
                await this.dbo.collection("coingecko").findOneAndReplace({id: cryptos[crypto].id}, cryptos[crypto], {upsert: true});
                ++updates
            }
            return updates;
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
}

module.exports = MongoHelper
