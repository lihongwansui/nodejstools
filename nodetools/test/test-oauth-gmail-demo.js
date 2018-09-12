/**
 * yang.yang@gloritysolutions.com
 */
// const user_name     = 'yang.yang@gloritysolutions.com';
// const refresh_token = '1/Z3ZZEENzwjN5kHkvqT0zYUB4vtjSiWXdU35fhUyjuGo';
// const access_token  = 'ya29.GlvmBXqqjYYADKliLwGGQiLAdrpIF5x7pfKO2-tXYcj8cG6YEG9QRkdhx7VmT1RzkWRvvuMriQesCrz-fObA87FsLQsgesPTlAQBtV5DHRcAJsgKvPGwlehy_KM2';
// const client_id     = '471703724724-4s7ogguocjcj69510mtg6km6ad9oib9a.apps.googleusercontent.com';
// const client_secret = 'ehgV2QBFJEa-p2c7dSAd4HYN';

/**
 * yang.yang@zhujian.io
 */
const user_name     = 'yang.yang@zhujian.io';
const refresh_token = '1/AwcO4wQICuK_hjGQzIqQx7CORwZjYpNZaK1f-CQQEs4';
const access_token  = 'ya29.GlvmBSDicL9OsodykG22VodMFHs2ZsHz0O4VnM_bLfMRQX829mRUxiWPJh22kkSHopT-h49WwT7YHWd3953ExCAK6WfUc8tmZeU2MeSG9WtLzq28fBK1LscOmPmD';
const client_id     = '513777791696-opg2c71lf2o92t74larh1305bmi8u0o7.apps.googleusercontent.com';
const client_secret = 'XPc4WyjIcoR9OlrVHsjA_UZU';

const email_to = 'spursyy@outlook.com';

const nodemailer = require('nodemailer');

let transporter = nodemailer
.createTransport({
    service: 'Gmail',
    // auth: {
    //     type: 'OAuth2',
    //     clientId: client_id,
    //     clientSecret: client_secret
    // }
    auth: {
        type: 'OAuth2',
        user: user_name,
        clientId: client_id,
        clientSecret: client_secret,
        refreshToken: refresh_token,
        accessToken: access_token,
        //timeout: smtpConfig.access_timeout - Date.now()
    }
});
transporter.on('token', token => {
    console.log('A new access token was generated');
    console.log('User: %s', token.user);
    console.log('Access Token: %s', token.accessToken);
    console.log('Expires: %s', new Date(token.expires));
});
// setup e-mail data with unicode symbols
let mailOptions = {
    from    : user_name, // sender address
    to      : email_to, // list of receivers
    subject : 'Hello ✔', // Subject line
    text    : 'Hello world ?', // plaintext body
    html    : '<b>Hello world ?</b>', // html body

    // auth : {
    //     user         : user_name,
    //     refreshToken : refresh_token,
    //     accessToken  : access_token,
    //     //expires      : 1494388182480
    // }
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        return console.log(error);
    }
    console.log('Message sent: ' + JSON.stringify(info.response));
});