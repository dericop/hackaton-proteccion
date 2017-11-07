'use strict';

const crypto = require('crypto');
const senderCertificate = global.__cert.senderCertificate;
const selfPrivateKey = global.__cert.selfPrivateKey;

function validateSignature(req, signature, buf) {

    let verify = crypto.createVerify('sha256');
    if  (process.env.NO_SIGNATURE) {
        return  true; //no subir este archivo al git
    }
    if (!signature) {
        throw new Error('Invalid request...');
    } else {
        verify.update(buf);
        return verify.verify(senderCertificate, signature, 'hex');
    }
}

function getSignature(message) {

    let sign = crypto.createSign('sha256');

    if (!message) {
        return false;
    } else {

        let payload = message;
        payload.result = 'processed';
        let response = payload;

        sign.update(JSON.stringify(response));

        let signature = sign.sign(selfPrivateKey).toString('hex');

        if (signature) {
            return signature;
        } else {
            return false;
        }
    }
}

module.exports = {
    cert: {
        validateSignature: validateSignature,
        getSignature: getSignature
    }
};
