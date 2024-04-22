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
    return `${config.get('coingecko_quotation_url')}?` +
        `vs_currencies=${config.get('coingecko_currency')}&ids=${ids}`
}
let getQuotationsFromApi = async () => {
    let symbolList = (await getAllSymbols()).join(",");
    let url = buildQuotationUrl(symbolList);
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
    console.log(tag, `date:${new Date()} coin:${coin.symbol} current:${coin.quotation} 5mn:${coin.last_five_minutes_quotation} hour:${coin.last_one_hour_quotation} day: ${coin.last_day_quotation}`)
}

/**
 *
 * @param token
 * @param alerts
 * @returns {alert|null}
 */
let findTokenAlertInAlerts = (token, alerts) => {
    let alert = null;
    let globalAlert = null;
    for (let i = 0; i < alerts.length; i++) {
        if (alerts[i].token.toUpperCase() === token.toUpperCase() || alerts[i].token.toUpperCase() === '_ALL_TOKENS_') {
            if (alerts[i].token.toUpperCase() === '_ALL_TOKENS_') {
                globalAlert = alerts[i];
            } else {
                alert = alerts[i];
            }
        }
    }
    return alert !== null ? alert : globalAlert;
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
    if (notification.type === 'lt5mn') {
        return config.get('language') === 'fr' ?
            `😩 ${notification.token} a perdu ${notification.rateValue}% en 5mn (cours=${notification.tokenValue} ${config.get('fiat_currency')}) .` :
            `😩 ${notification.token} lost ${notification.rateValue}% in 5mn (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'gt5mn') {
        return config.get('language') === 'fr' ?
            `😀 ${notification.token} a gagné ${notification.rateValue}% en 5mn (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😀 ${notification.token} gained ${notification.rateValue}% in 5mn (quotation=${notification.tokenValue} ${config.get('fiat_currency')}.`
    } else if (notification.type === 'lt1h') {
        return config.get('language') === 'fr' ?
            `😩 ${notification.token} a perdu ${notification.rateValue}% en 1h (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😩 ${notification.token} lost ${notification.rateValue}% in 1h (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'gt1h') {
        return config.get('language') === 'fr' ?
            `😀 ${notification.token} a gagné ${notification.rateValue}% en 1h (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😀 ${notification.token} gained ${notification.rateValue}% in 1h (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'lt24h') {
        return config.get('language') === 'fr' ?
            `😩 ${notification.token} a perdu ${notification.rateValue}% en 1 jour (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😩 ${notification.token} lost ${notification.rateValue}% in 1 day (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'gt24h') {
        return config.get('language') === 'fr' ?
            `😀 ${notification.token} a gagné ${notification.rateValue}% en 1 jour (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😀 ${notification.token} gained ${notification.rateValue}% in 1 day (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'lt1w') {
        return config.get('language') === 'fr' ?
            `😩 ${notification.token} a perdu ${notification.rateValue}% en 1 semaine (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😩 ${notification.token} lost ${notification.rateValue}% in 1 week (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
    } else if (notification.type === 'gt1w') {
        return config.get('language') === 'fr' ?
            `😀 ${notification.token} a gagné ${notification.rateValue}% en 1 semaine (cours=${notification.tokenValue} ${config.get('fiat_currency')}).` :
            `😀 ${notification.token} gained ${notification.rateValue}% in 1 week (quotation=${notification.tokenValue} ${config.get('fiat_currency')}).`
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

let storeNotification = (type, token, tokenValue, rateValue, notifications) => {
    notifications.push({
        type: type,
        token: token.toUpperCase(),
        tokenValue: tokenValue.toFixed(2),
        rateValue: rateValue.toFixed(2)
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
let setNotificationIfRequired = (typeFamily, token, tokenValue, previousTokenValue, alert, notifications) => {
    if (alert != null) {
        let rateValue = (tokenValue - previousTokenValue) * 100 / previousTokenValue;
        if (rateValue === 0) return;
        if (typeFamily === '5mn') {
            if (alert.gt5mn > 0 && rateValue >= (alert.gt5mn * 1)) {
                storeNotification('gt5mn', token, tokenValue, rateValue, notifications);
            } else if (alert.lt5mn > 0 && rateValue <= (alert.lt5mn * -1)) {
                storeNotification('lt5mn', token, tokenValue, rateValue, notifications);
            }
        } else if (typeFamily === '1h') {
            if (alert.gt1h > 0 && rateValue >= (alert.gt1h * 1)) {
                storeNotification('gt1h', token, tokenValue, rateValue, notifications);
            } else if (alert.lt1h > 0 && rateValue <= (alert.lt1h * -1)) {
                storeNotification('lt1h', token, tokenValue, rateValue, notifications);
            }
        } else if (typeFamily === '24h') {
            if (alert.gt24h > 0 && rateValue >= (alert.gt24h * 1)) {
                storeNotification('gt24h', token, tokenValue, rateValue, notifications);
            } else if (alert.lt24h > 0 && rateValue <= (alert.lt24h * -1)) {
                storeNotification('lt24h', token, tokenValue, rateValue, notifications);
            }
        } else if (typeFamily === '1w') {
            if (alert.gt1w > 0 && rateValue >= (alert.gt1w * 1)) {
                storeNotification('gt1w', token, tokenValue, rateValue, notifications);
            } else if (alert.lt1w > 0 && rateValue <= (alert.lt1w * -1)) {
                storeNotification('lt1w', token, tokenValue, rateValue, notifications);
            }
        }
    }
}


let update = async () => {
    let updates = 0;
    let notificationTokens = [];
    let currency = config.get('coingecko_currency');
    // { id:, name:, eur: }
    let cryptos = await getQuotationsFromApi();
    let alerts = await new MongoHelper().getAlerts();
    if (cryptos.errorGecko !== true) {
        let usdtValue = cryptos["tether"][currency];
        await new MongoHelper().updateUsdtValueInCurrentFiat(usdtValue);
        for (let cryptoId in cryptos) {
            let coin = await new MongoHelper().findMyCrypto(cryptoId);
            showUpdateDetail("before", coin)
            if (coin !== null) {
                let alert = findTokenAlertInAlerts(coin.symbol, alerts);
                let crypto = cryptos[coin.id];
                coin["last_five_minutes_quotation"] = coin.quotation === null ? 0 : coin.quotation;
                coin["quotation"] = crypto[currency];
                setNotificationIfRequired('5mn', coin.symbol, coin.quotation,
                    coin.last_five_minutes_quotation, alert, notificationTokens)
                coin["quotation_usdt"] = crypto[currency] / usdtValue;
                coin["quotation_date"] = new Date();
                coin["last_five_minutes_quotation_date"] = new Date()
                if (coin["last_one_hour_quotation"] !== undefined) {
                    if ((new Date().getTime() - coin["last_one_hour_quotation_date"].getTime()) >= 3600 * 1000) {
                        coin["last_one_hour_quotation_date"] = new Date();
                        setNotificationIfRequired('1h', coin.symbol, coin.quotation,
                            coin.last_one_hour_quotation, alert, notificationTokens)
                        coin["last_one_hour_quotation"] = crypto[currency];
                    }
                } else {
                    coin["last_one_hour_quotation_date"] = new Date();
                    coin["last_one_hour_quotation"] = crypto[currency];
                }
                if (coin["last_day_quotation"] !== undefined) {
                    if ((new Date().getTime() - coin["last_day_quotation_date"].getTime()) >= 3600 * 24 * 1000) {
                        coin["last_day_quotation_date"] = new Date();
                        setNotificationIfRequired('24h', coin.symbol, coin.quotation,
                            coin.last_day_quotation, alert, notificationTokens)
                        coin["last_day_quotation"] = crypto[currency];
                    }
                } else {
                    coin["last_day_quotation_date"] = new Date();
                    coin["last_day_quotation"] = crypto[currency];
                }
                if (coin["last_week_quotation"] !== undefined) {
                    if ((new Date().getTime() - coin["last_week_quotation_date"].getTime()) >= 3600 * 24 * 7 * 1000) {
                        coin["last_week_quotation_date"] = new Date();
                        setNotificationIfRequired('1w', coin.symbol, coin.quotation,
                            coin.last_week_quotation, alert, notificationTokens)
                        coin["last_week_quotation"] = crypto[currency];
                    }
                } else {
                    coin["last_week_quotation_date"] = new Date();
                    coin["last_week_quotation"] = crypto[currency];
                }
                ++updates;
                showUpdateDetail("after", coin)
                await new MongoHelper().findOneAndReplaceInMyCryptos(coin);
            }
        }
    }
    await handleNotifications(notificationTokens);
    return updates;
}

exports.update = update