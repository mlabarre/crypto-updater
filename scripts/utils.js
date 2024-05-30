const config = require("config");

const sendNotification = async (data, title) => {
    return await fetch(`${config.notification_ntfy_url}/${config.notification_ntfy_topic}`,
        {
            method: 'POST',
            body: data,
            headers: {'Title': title}
        })
}

const formatNewCoins = (newCoins) => {
    let message = "";
    for (let i=0; i<newCoins.length; i++) {
        message += `${newCoins[i].name} (${newCoins[i].symbol.toUpperCase()})\n`;
    }
    return message;
}

exports.sendNotification = sendNotification
exports.formatNewCoins = formatNewCoins