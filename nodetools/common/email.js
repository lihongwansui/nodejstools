const config = require('./config');
const nodemailer = require('nodemailer');

let InitTransport = function() {
    try {
        let transporter = nodemailer.createTransport({
            //service: 'qq',
            host: "smtp.exmail.qq.com",
            port: 465,
            auth: {
                user: config.Mail.user_name,
                pass: config.Mail.password
            }
        });
        return transporter;
    } catch (error) {
        throw error;      
    }
}

let InitOAuthTransport = function() {
    try {
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                type: 'OAuth2',
                user: config.OAuth_Gmail.user_name,
                clientId: config.OAuth_Gmail.client_id,
                clientSecret: config.OAuth_Gmail.client_secret,
                refreshToken: config.OAuth_Gmail.refresh_token,
                accessToken: config.OAuth_Gmail.access_token,
                //timeout: smtpConfig.access_timeout - Date.now()
            }
        });
        return transporter;
    } catch (error) {
        throw error;
    }
}

let SendEmail = function(transporter, mailOptions) {
    try {
        return new Promise(function(resolve, reject) {
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    reject(error);
                } else if (info && info.response) {
                    resolve({status: 1, message: "Send successfully"})
                } else {
                    resolve({status: 0});
                }
            });
        })
    } catch (error) {
        throw error;
    }
}

module.exports = {InitTransport: InitTransport, InitOAuthTransport: InitOAuthTransport, SendEmail: SendEmail};