const {InitTransport, InitOAuthTransport, SendEmail} = require('../common/email');
const config = require('../common/config');

let SendOAuthEmail = async function() {
    let transporter = InitOAuthTransport();

    let mailOptions = {
        from    : config.OAuth_Gmail.user_name,
        to      : "yspursy@gmail.com", 
        subject : 'Init OAuth',
        text    : 'Hello Init OAtuht?',
        html    : '<b>Hello Init OAuth ?</b>',
    };
    return await SendEmail(transporter, mailOptions);
};

let SendOrdinaryEmail = async function() {
    let transporter = InitTransport();
    let mailOptions = {
        from    : config.OAuth_Gmail.user_name,
        to      : "yspursy@gmail.com", 
        subject : 'Init Email',
        text    : 'Hello Init Email?',
        html    : '<b>Hello Init Email ?</b>',
    };
    return await SendEmail(transporter, mailOptions);
}

let Init = async function() {
    let result1 = await SendOrdinaryEmail();
    console.log(`Send email result is ${JSON.stringify(result1)}`);

    let result2 = await SendOAuthEmail();
    console.log(`Send OAuth email result is ${JSON.stringify(result2)}`);
}

Init();