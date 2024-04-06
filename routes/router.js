const express = require('express');
const router = express.Router();
const transactionHandler = require('../scripts/transactions');
const portFolio = require('../scripts/portfolio');
const followTransactions = require('../scripts/followTransactions')
const cryptos = require('../scripts/cryptos')
const wallets = require('../scripts/wallets')

/* GET home page. */
router
    /* View rending */
    .get('/', function (request, response, next) {
        response.render('index', {title: 'Express'});
    })
    .get('/home', function (request, response, next) {
        response.render('index', {title: 'Express'});
    })
    .get('/addTransaction', function (request, response, next) {
        response.render('addTransaction', {});
    })
    .get('/portfolio', function (request, response, next) {
        response.render('portfolio', {});
    })
    .get('/evolution', function (request, response, next) {
        response.render('evolution', {});
    })
    .get('/followTransactions', function (request, response, next) {
        response.render('followTransactions', {});
    })
    .get('/cryptos', function (request, response, next) {
        response.render('cryptos', {});
    })
    .get('/wallets', function (request, response, next) {
        response.render('wallets', {});
    })
    /* Ajax calls */
    .post('/api/add-transaction', function (request, response, next) {
        console.log("request body", request.body);
        transactionHandler.handleTransactionInsert(request.body).then((data) => {
            response.send(data);
        })
    })
    .get('/api/portfolio', function (request, response, next) {
        portFolio.summary().then((data) => {
            response.send(data);
        })
    })
    .get('/api/evolution', function (request, response, next) {
        portFolio.evolution(request.query.sortField, request.query.sortDirection).then((data) => {
            response.send(JSON.stringify(data));
        })
    })
    .get('/api/follow-token-on-wallet', function (request, response, next) {
        followTransactions.follow(request.query.token, request.query.wallet, request.query.sortDirection).then((data) => {
            response.send(data);
        })
    })
    .get('/api/get-all-symbols', function (request, response, next) {
        followTransactions.getAllSymbols(request.query.token, request.query.wallet).then((data) => {
            response.send(data);
        })
    })
    .get('/api/get-all-wallets', function (request, response, next) {
        followTransactions.getAllWallets(request.query.token, request.query.wallet).then((data) => {
            response.send(data);
        })
    })
    .get('/api/get-my-cryptos', function (request, response, next) {
        cryptos.getMyCryptos(request.query.token, request.query.wallet).then((data) => {
            response.send(data);
        })
    })
    .get('/api/get-available-cryptos', function (request, response, next) {
        cryptos.getAvailableCryptos(request.query.token, request.query.wallet).then((data) => {
            response.send(data);
        })
    })
    .post('/api/add-to-my-cryptos', function (request, response, next) {
        cryptos.addToMyCrypto(request.body).then((data) => {
            response.sendStatus(201);
        }).catch((error) => {
            response.send(error);
        })
    })
    .delete('/api/delete-from-my-cryptos', function (request, response, next) {
        let crypto = { "id": request.query.id, "symbol": request.query.symbol, "name": request.query.name, }
        cryptos.removeFromMyCrypto(crypto).then((data) => {
            response.sendStatus(200);
        }).catch((error) => {
            response.send(error);
        })
    })
    .post('/api/add-wallet', function (request, response, next) {
        wallets.addWallet(request, response);
    })
    .get('/api/get-wallets-name', function (request, response, next) {
        wallets.getWallets().then((data) => {
            response.send(data);
        })
    })


module.exports = router;
