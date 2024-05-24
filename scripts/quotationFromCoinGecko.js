const config = require('config');
const MongoHelper = require('../scripts/mongoHelper');

let getAllSymbolsInMyCryptos = async () => {
    let list = await new MongoHelper().findAllSymbolsInMyCryptos();
    let symbols = [];
    await list.forEach((t) => {
        symbols.push(t.id);
    })
    if (!symbols.includes("tether")) {
        symbols.push("tether");
    }
    return symbols.sort();
}

let getAllSymbolsInCryptosSurvey = async () => {
    let list = await new MongoHelper().findAllSymbolsInCryptosSurvey()
    let symbols = [];
    await list.forEach((t) => {
        symbols.push(t.id);
    })
    return symbols.sort();
}

let buildQuotationUrl = (idsMyCryptos, idsSurvey) => {
    let ids = idsMyCryptos.concat(idsSurvey).join(",");
    return `${config.get('coingecko_quotation_url')}?` +
        `vs_currency=${config.get('coingecko_currency')}&ids=${ids}`
}

let getQuotationsFromApi = async (symbolListMyCryptos, symbolListCryptosSurvey) => {
    let url = buildQuotationUrl(symbolListMyCryptos, symbolListCryptosSurvey);
    let response = await fetch(url)
    if (response.status === 200) {
        return await response.json();
    } else {
        console.log(`Error getting coin currency for url ${url}`);
        console.log(`Error info : ${response.statusText}. ${response.statusMessage}`);
        return {"errorGecko": true};
    }
}

let showUpdateDetail = (tag, coin) => {
    console.log(tag, `date:${new Date()} coin:${coin.symbol} current:${coin.quotation} ` +
        `5mn:${coin.last_five_minutes_quotation} hour:${coin.last_one_hour_quotation} day: ${coin.last_day_quotation}`)
}

let isNewNotification = (storedNotification, token, type, value) => {
    for (let i = 0; i < storedNotification.length; i++) {
        if (storedNotification.type === type && storedNotification.token === token &&
            storedNotification.tokenValue === value) {
            return false;
        }
    }
    return true;
}

let sendNotification = async (data) => {
    return await fetch(`${config.notification_ntfy_url}/${config.notification_ntfy_topic}`,
        {
            method: 'POST',
            body: data,
            headers: {'Title': 'Crypto alert'}
        })
}

/**
 *
 * @param notification Notification
 * @param notification.type gt5mn, lt5mn, ht1h, lt1h, gt24h, lt24h
 * @param notification.token Token
 * @param notification.tokenValue Token value
 * @param notification.rateValue Token rate value according type.
 */
let buildPhrase = (notification) => {
    let rate = ((parseFloat(notification.rateValue) * 100) / 100).toFixed(2);
    if (notification.type === 'lt5mn') {
        return config.get('language') === 'fr' ?
            `😩 ${notification.token} a perdu ${rate}% en 5mn (cours=${notification.tokenValue} ${config.get('fiat_currency')}) .` :
            `😩 ${notification.token} lost ${rate}% in 5mn (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'gt5mn') {
        return config.get('language') === 'fr' ?
            `😀 ${notification.token} a gagné ${rate}% en 5mn (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😀 ${notification.token} gained ${rate}% in 5mn (quotation=${notification.tokenValue} ${config.get('fiat_currency')}.`
    } else if (notification.type === 'lt1h') {
        return config.get('language') === 'fr' ?
            `😩 ${notification.token} a perdu ${rate}% en 1h (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😩 ${notification.token} lost ${rate}% in 1h (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'gt1h') {
        return config.get('language') === 'fr' ?
            `😀 ${notification.token} a gagné ${rate}% en 1h (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😀 ${notification.token} gained ${rate}% in 1h (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'lt24h') {
        return config.get('language') === 'fr' ?
            `😩 ${notification.token} a perdu ${rate}% en 1 jour (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😩 ${notification.token} lost ${rate}% in 1 day (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'gt24h') {
        return config.get('language') === 'fr' ?
            `😀 ${notification.token} a gagné ${rate}% en 1 jour (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😀 ${notification.token} gained ${rate}% in 1 day (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'lt1w') {
        return config.get('language') === 'fr' ?
            `😩 ${notification.token} a perdu ${rate}% en 1 semaine (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😩 ${notification.token} lost ${rate}% in 1 week (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'gt1w') {
        return config.get('language') === 'fr' ?
            `😀 ${notification.token} a gagné ${rate}% en 1 semaine (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😀 ${notification.token} gained ${rate}% in 1 week (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    }
}


let handleNotifications = async (notifications) => {
    let stored = await new MongoHelper().getNotifications();
    let body = "";
    for (let i = 0; i < notifications.length; i++) {
        let notification = notifications[i];
        if (isNewNotification(stored, notification.token, notification.type, notification.tokenValue)) {
            body += `${buildPhrase(notification)}\n`;
            notification.date = new Date();
            await new MongoHelper().addOrUpdateNotification(notification);
        }
    }
    if (body !== '') {
        await sendNotification(body);
    }
    return {}
}

let storeNotification = async (type, token, tokenValue, previousTokenValue, rateValue, notifications) => {
    await notifications.push({
        type: type,
        token: token.toUpperCase(),
        tokenValue: tokenValue,
        previousTokenValue: previousTokenValue,
        rateValue: rateValue
    });
}
/**
 *
 * @param typeFamily '5mn', '1h', '24h'.
 * @param token Token.
 * @param tokenValue Current token value.
 * @param previousTokenValue Previous token value according to type.
 * @param alert {alert|null} Alert object | null.
 * @param alert.token Token
 * @param alert.gt5mn 5 mn up threshold
 * @param alert.lt5mn 5 mn down threshold
 * @param alert.gt1h 1 hour up threshold
 * @param alert.lt1h 1 hour down threshold
 * @param alert.gt24h 1 day up threshold
 * @param alert.lt24h 1 day down threshold
 * @param alert.gt1w 1 week up threshold
 * @param alert.lt1w 1 week down threshold
 * @param notifications Notifications array.
 */
let setNotificationIfRequired = async (typeFamily, token, tokenValue, previousTokenValue, alert, notifications) => {
    if (alert != null) {
        let rateValue = (tokenValue - previousTokenValue) * 100 / previousTokenValue;
        if (rateValue === 0) return;
        if (typeFamily === '5mn') {
            if (alert.gt5mn > 0 && rateValue >= (alert.gt5mn * 1)) {
                await storeNotification('gt5mn', token, tokenValue, previousTokenValue, rateValue, notifications);
            } else if (alert.lt5mn > 0 && rateValue <= (alert.lt5mn * -1)) {
                await storeNotification('lt5mn', token, tokenValue, previousTokenValue, rateValue, notifications);
            }
        } else if (typeFamily === '1h') {
            if (alert.gt1h > 0 && rateValue >= (alert.gt1h * 1)) {
                await storeNotification('gt1h', token, tokenValue, previousTokenValue, rateValue, notifications);
            } else if (alert.lt1h > 0 && rateValue <= (alert.lt1h * -1)) {
                await storeNotification('lt1h', token, tokenValue, previousTokenValue, rateValue, notifications);
            }
        } else if (typeFamily === '24h') {
            if (alert.gt24h > 0 && rateValue >= (alert.gt24h * 1)) {
                await storeNotification('gt24h', token, tokenValue, previousTokenValue, rateValue, notifications);
            } else if (alert.lt24h > 0 && rateValue <= (alert.lt24h * -1)) {
                await storeNotification('lt24h', token, tokenValue, previousTokenValue, rateValue, notifications);
            }
        } else if (typeFamily === '1w') {
            if (alert.gt1w > 0 && rateValue >= (alert.gt1w * 1)) {
                await storeNotification('gt1w', token, tokenValue, previousTokenValue, rateValue, notifications);
            } else if (alert.lt1w > 0 && rateValue <= (alert.lt1w * -1)) {
                await storeNotification('lt1w', token, tokenValue, previousTokenValue, rateValue, notifications);
            }
        }
    }
}

let getAlert = (token, alerts) => {
    let alert = null;
    let globalAlert = null;
    for (let i = 0; i < alerts.length; i++) {
        if (alerts[i].token.toUpperCase() === token.toUpperCase() ||
            alerts[i].token.toUpperCase() === '_ALL_TOKENS_') {
            if (alerts[i].token.toUpperCase() === '_ALL_TOKENS_') {
                globalAlert = alerts[i];
            } else {
                alert = alerts[i];
            }
        }
    }
    return alert !== null ? alert : globalAlert;
}
/**
 *
 * @param token
 * @param id
 * @param token
 * @param alertsCryptos
 * @param alertsSurvey
 * @param symbolListCryptosSurvey
 * @returns {alert|null}
 */
let findTokenAlertInAlerts = (id, token, alertsCryptos, alertsSurvey, symbolListCryptosSurvey) => {
    let isSurvey = symbolListCryptosSurvey.indexOf(id) >= 0;
    if (isSurvey === false) {
        return getAlert(token, alertsCryptos);
    } else {
        return getAlert(token, alertsSurvey);
    }
}

/**
 *
 * @param cryptoId
 * @returns {Promise<{survey: boolean, coin: *}|null>}
 */
let findCrypto = async (cryptoId) => {
    let survey = false;
    let coin = await new MongoHelper().findMyCrypto(cryptoId);
    if (coin === null) {
        coin = await new MongoHelper().findCryptosSurvey(cryptoId);
        survey = true;
    }
    if (coin !== null) {
        return {
            coin: coin,
            survey: survey
        }
    } else {
        return null
    }
}

let updateMonitoredCoin = async (coin, survey) => {
    if (survey === true) {
        return await new MongoHelper().findOneAndReplaceInCryptosSurvey(coin);
    } else {
        return await new MongoHelper().findOneAndReplaceInMyCryptos(coin);
    }
}

let updateNonMonitoredCoin = async (coin) => {
    return await new MongoHelper().findOneAndReplaceInCryptosNotMonitored(coin);
}

let handleOneHourQuotation = async (coin, currency, crypto, alert, notificationTokens) => {
    if (coin["last_one_hour_quotation"] !== undefined && coin["last_one_hour_quotation_date"] !== null) {
        if ((new Date().getTime() - coin["last_one_hour_quotation_date"].getTime()) >= 3600 * 1000) {
            coin["last_one_hour_quotation_date"] = new Date();
            await setNotificationIfRequired('1h', coin.symbol, coin.quotation,
                coin.last_one_hour_quotation, alert, notificationTokens)
            coin["last_one_hour_quotation"] = crypto.current_price;
        }
    } else {
        coin["last_one_hour_quotation_date"] = new Date();
        coin["last_one_hour_quotation"] = crypto.current_price;
    }
}

let handleOneDayQuotation = async (coin, currency, crypto, alert, notificationTokens) => {
    console.log(JSON.stringify(crypto, null, 2))
    if (crypto.price_change_24h !== null && crypto.price_change_24h !== undefined) {
        coin["last_day_quotation"] = crypto.current_price - crypto.price_change_24h;
        coin["last_day_quotation_date"] = new Date(crypto.last_updated);
    } else {
        if (coin["last_day_quotation"] !== undefined && coin["last_day_quotation_date"] !== null) {
            if ((new Date().getTime() - coin["last_day_quotation_date"].getTime()) >= 3600 * 24 * 1000) {
                coin["last_day_quotation_date"] = new Date();
                coin["last_day_quotation"] = crypto.current_price;
            }
        } else {
            coin["last_day_quotation_date"] = new Date();
            coin["last_day_quotation"] = crypto.current_price;
            return;
        }
    }
    if ((new Date().getTime() - coin["last_day_quotation_date"].getTime()) >= 3600 * 24 * 1000) {
        await setNotificationIfRequired('24h', coin.symbol, coin.quotation,
            coin.last_day_quotation, alert, notificationTokens);
    }
}

let handleOneWeekQuotation = async (coin, currency, crypto, alert, notificationTokens) => {
    if (coin["last_week_quotation"] !== undefined && coin["last_week_quotation_date"] !== null) {
        if ((new Date().getTime() - coin["last_week_quotation_date"].getTime()) >= 3600 * 24 * 7 * 1000) {
            coin["last_week_quotation_date"] = new Date();
            await setNotificationIfRequired('1w', coin.symbol, coin.quotation,
                coin.last_week_quotation, alert, notificationTokens)
            coin["last_week_quotation"] = crypto.current_price;
        }
    } else {
        coin["last_week_quotation_date"] = new Date();
        coin["last_week_quotation"] = crypto.current_price;
    }
}

/**
 * Handle coin.
 * @param coinResult Object with mongodb stored coin.
 * @param currency Currency.
 * @param usdtValue Current USDT value.
 * @param crypto Crypto from API.
 * @param alertsCryptos Alerts for MyCryptos.
 * @param alertsSurvey Alerts for Survey.
 * @param symbolListCryptosSurvey List of symbols to survey.
 * @param notificationTokens Notifications.
 * @returns {Promise<void>}
 */
let handleMonitoredCoin = async (coinResult, currency, usdtValue, crypto, alertsCryptos, alertsSurvey,
                                 symbolListCryptosSurvey, notificationTokens) => {
    let coin = coinResult.coin;
    showUpdateDetail("before", coin)
    let alert = findTokenAlertInAlerts(coin.id, coin.symbol, alertsCryptos, alertsSurvey, symbolListCryptosSurvey);
    coin["last_five_minutes_quotation"] = coin.quotation === null ? 0 : coin.quotation;
    coin["quotation"] = crypto.current_price;
    await setNotificationIfRequired('5mn', coin.symbol, coin.quotation,
        coin.last_five_minutes_quotation, alert, notificationTokens)
    coin["quotation_usdt"] = crypto.current_price / usdtValue;
    coin["quotation_date"] = new Date();
    coin["last_five_minutes_quotation_date"] = new Date();
    await handleOneHourQuotation(coin, currency, crypto, alert, notificationTokens);
    await handleOneDayQuotation(coin, currency, crypto, alert, notificationTokens);
    await handleOneWeekQuotation(coin, currency, crypto, alert, notificationTokens);
    showUpdateDetail("after", coin);
    coin["info"] = crypto;
    await updateMonitoredCoin(coin, coinResult.survey);
}

let handleNotMonitoredCoin = async (crypto, currency, usdtValue, alert, notificationTokens) => {
    let coin = await new MongoHelper().findCryptoNotMonitored(crypto.id);
    if (coin === null) {
        let cryptoCoingecko = await new MongoHelper().findCryptoInCoingecko(crypto.id);
        coin = {
            id: crypto.id,
            symbol: cryptoCoingecko.symbol,
            name: cryptoCoingecko.name
        }
        coin["last_five_minutes_quotation"] = coin.quotation === null ? 0 : coin.quotation;
        coin["quotation"] = crypto[currency];
        await setNotificationIfRequired('5mn', coin.symbol, coin.quotation,
            coin.last_five_minutes_quotation, alert, notificationTokens)
        coin["quotation_usdt"] = crypto[currency] / usdtValue;
        coin["quotation_date"] = new Date();
        coin["last_five_minutes_quotation_date"] = new Date();
        await handleOneHourQuotation(coin, currency, alert, notificationTokens);
        await handleOneDayQuotation(coin, currency, alert, notificationTokens);
        await handleOneWeekQuotation(coin, currency, alert, notificationTokens);
        showUpdateDetail("after", coin)
        await updateNonMonitoredCoin(coin);
    }
}

let getUsdtValue = (cryptos) => {
    for (let cryptoIndex in cryptos) {
        if (cryptos[cryptoIndex].id === 'tether') {
            return cryptos[cryptoIndex].current_price;
        }
    }
    return 0;
}

let updateNonIco = async () => {
    let updates = 0;
    let notificationTokens = [];
    let currency = config.get('coingecko_currency');
    let symbolListMyCryptos = await getAllSymbolsInMyCryptos();
    let symbolListCryptosSurvey = await getAllSymbolsInCryptosSurvey();
    // { id:, name:, eur: }
    let cryptosFromApi = await getQuotationsFromApi(symbolListMyCryptos, symbolListCryptosSurvey);
    let alertsCryptos = await new MongoHelper().getAlerts();
    let alertsSurvey = await new MongoHelper().getAlertsSurvey();
    //let alertAllCoinGecko = await new MongoHelper().getAlertAllCoingecko();
    let usdtValue;
    if (cryptosFromApi.errorGecko !== true) {
        usdtValue = getUsdtValue(cryptosFromApi);
        await new MongoHelper().updateUsdtValueInCurrentFiat(usdtValue);
        for (let cryptoIndex in cryptosFromApi) {
            let coinResult = await findCrypto(cryptosFromApi[cryptoIndex].id);
            if (coinResult !== null) {
                await handleMonitoredCoin(coinResult, currency, usdtValue, cryptosFromApi[cryptoIndex],
                    alertsCryptos, alertsSurvey,
                    symbolListCryptosSurvey, notificationTokens);
                ++updates;
            } else {
                // Crypto not referenced by dashboard. NOT POSSIBLE : COINGECKO RESTRICTIONS ON id
                //await handleNotMonitoredCoin(cryptosFromApi[cryptoId], currency, usdtValue,
                //    alertAllCoinGecko, notificationTokens);
            }
        }
    }
    return {
        updates: updates,
        usdtValue: usdtValue,
        alertsCryptos: alertsCryptos,
        notificationTokens: notificationTokens
    };
}

let updateIco = async (nonIcoResult) => {
    let updates = nonIcoResult.updates;
    let currency = config.get('coingecko_currency');
    let listMyCryptos = await new MongoHelper().findAllMyCryptosIco();
    for (let i = 0; i < listMyCryptos.length; i++) {
        let cryptoFromMyCrypto = listMyCryptos[i];
        if (cryptoFromMyCrypto.ico_address === undefined || cryptoFromMyCrypto.ico_address === '') {
            continue;
        }
        let coinResult = {
            coin: cryptoFromMyCrypto,
            survey: false
        }
        let url = config.get('geckoterminal_quotation_url').replace("NETWORK", cryptoFromMyCrypto.ico_network);
        url += cryptoFromMyCrypto.ico_address;
        let response = await fetch(url);
        if (response.ok) {
            let res = await response.json();
            if (res.data.type === 'simple_token_price') {
                let o = res.data.attributes.token_prices;
                let crypto = { current_price: parseFloat(Object.values(o)[0])}
                await handleMonitoredCoin(coinResult, currency, nonIcoResult.usdtValue, crypto,
                    nonIcoResult.alertsCryptos, [], [], nonIcoResult.notificationTokens);
                updates++;
                continue;
            }
        }
        console.log(`Cannot fetch URL ${url} : status ${response.status}`)
    }
    return updates;
}

let update = async () => {
    let nonIcoResult = await updateNonIco();
    let updates = await updateIco(nonIcoResult);
    await handleNotifications(nonIcoResult.notificationTokens);
    return updates
}
exports.update = update