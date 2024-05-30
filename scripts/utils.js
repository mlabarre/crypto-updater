const config = require("config");

const sendNotification = async (data, title) => {
    return await fetch(`${config.notification_ntfy_url}/${config.notification_ntfy_topic}`,
        {
            method: 'POST',
            body: data,
            headers: {'Title': title}
        })
}

exports.sendNotification = sendNotification