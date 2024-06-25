
let mongodb = require('mongodb')
let express = require('express');

const MongoClient = require('mongodb').MongoClient;

class MongoHelper {

    mongoClient;

    constructor() {
        this.mongoClient = null;
    }

    init = async () => {
        this.mongoClient = new MongoClient("mongodb://trading:27017/?serverSelectionTimeoutMS=3000&directConnection=true");
        let db = await this.mongoClient.connect();
        this.dbo = db.db('crypto');
    }
    
    getTradeDateTime = (timestamp) => {
        let d = new Date(timestamp);
        return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}T${this.pad(d.getHours())}:${this.pad(d.getMinutes())}:${this.pad(d.getSeconds())}.000Z`;
    }
    
    pad = (o) => {
    return (o > 9) ? o : "0" + o;
    }
    findBinanceSwapTransaction = async (outputToken, inputToken, date) => {
        let criteria = {
            type: 'swap',
            outputSymbol: 'USDT',
            inputSymbol: 'TRB',
            date: new Date(this.getTradeDateTime(date))
            //date: new Date("2024-06-22T09:57:36.000Z")
        }
        console.log("criteria", criteria)
        try {
            await this.init();
            return await this.dbo.collection("transactions").findOne(criteria);
        } finally {
            await this.mongoClient.close();
        }
    }
}

let app = express()

new MongoHelper().findBinanceSwapTransaction('','',1719043056048).then( (data) => {
    console.log(data)
})
