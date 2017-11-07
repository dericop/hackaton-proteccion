'use strict';
const logging = require('../../common/logging');
const logger = (psuid) => new logging({ senderId: psuid });

let profiles = null;

class userProfile {
    constructor(psuid) {
        this.psuid = psuid; // Page-scoped ID 
        this.idnum = ''; // User's identification number (depending on id type it may be alphanumeric)
        this.idtype = ''; // User's identification type
        this.name = '';
        this.lastname = '';
        this.svpactive = false; // Whether the user has access to SVP
        this.termsAndConditions = [];
        this.botRate = 0;
        this.rateStatus = ''; //Rate Never (RN), Rate Succes(RS)
        this.interactions = []; //Different topics that the user has experienced
        this.blockUntil = '';
    }
}

const ATTRIBUTES = ['psuid', 'idnum', 'idtype', 'name', 'lastname', 'svpactive', 'termsAndConditions', 'botRate', 'rateStatus', 'interactions', 'blockUntil'];

function recordByPSUID(psuid) {
    return new Promise((fulfill, reject) => {
        profiles.get(psuid, (err, data) => {
            if (err) {
                return reject(err);
            }
            fulfill(data);
        });
    });
}

function insertRecord(psuid, data) {
    return new Promise((fulfill, reject) => {
        data._id = psuid;
        logger(psuid).debug('About to insert new document in user database');
        profiles.insert(data, err => {
            if (err) {
                if (err.message === 'Document update conflict.') {
                    // Get the last version of the document and update it
                    return updateConflict(data);
                } else {
                    logger(psuid).error({ err: err }, 'Error inserting new document');
                    return reject();
                }
            }
            fulfill(data);
        });
    });
}

function updateConflict(data) {
    const psuid = data.psuid;
    return new Promise((fulfill, reject) => {
        profiles.get(psuid, (err, profile) => {
            if (err) {
                logger(psuid).error({ err: err }, 'Error reading document');
                return reject(err);
            }
            data._rev = profile._rev;
            profiles.insert(data, (err, result) => {
                if (err) {
                    logger(psuid).error({ err: err }, 'Error updating document');
                    return reject(err);
                }
                fulfill(result);
            });
        });
    });
}

function validateAttribute(attribute) {
    return !(ATTRIBUTES.indexOf(attribute) < 0);
}

function validateUser(user) {
    for (let attr in user) {
        if (!ATTRIBUTES.indexOf(attr) < 0) return false;
    }
    if (!user.psuid) return false;
    if (isNaN(user.psuid)) return false;
    // TODO: Validate other fields too
    return true;
}

function getUser(psuid) {
    return recordByPSUID(psuid).then(user => {
        if (!user) {
            user = new userProfile(psuid);
            return insertRecord(psuid, user);
        }
        return user;
    }).catch(err => {
        logger(psuid).error({ err: err }, 'Error getting user profile from database');
        if (err.statusCode === 404) {
            let user = new userProfile(psuid);
            return insertRecord(psuid, user);
        } else {
            throw err;
        }
    });
}

function validateUniqueIdentification(idtype, idnum) {
    return new Promise((fulfill, reject) => {
        let query = {
            selector: { idtype: idtype, idnum: idnum }
        };
        profiles.find(query, (err, result) => {
            if (err) {
                logger().error({ err: err }, 'Error in validateUniqueIdentification.');
                return reject(err);
            }
            if (result.docs.length > 0) {
                reject(false);
            }
            fulfill(true);
        });
    });
}

function putUser(user) {
    if (validateUser(user)) {
        let psuid = user.psuid;
        return getUser(psuid).then(dbUser => {
            if (dbUser) {
                // The user already exists, so update it
                Object.assign(dbUser, user);
                return insertRecord(psuid, dbUser);
            }
            // It's a new user, store it
            return insertRecord(psuid, user);
        });
    } else {
        return Promise.reject(-1); // Validation error
    }
}

/**
 * Get or set a specific attribute from the user profile
 * @param {number} psuid User's unique identifier
 * @param {String} attribute User's attribute name
 * @param {number|String|Bool|vector} value Optional attribute value
 */
function userAttribute(psuid, attribute, value) {
    if (!validateAttribute(attribute)) {
        return Promise.resolve(-1);
    }
    return getUser(psuid).then(user => {
        if (typeof (value) !== 'undefined') { // If specified, this is a 'put' operation
            user[attribute] = value;
            putUser(user); // Update the user
        }
        return user[attribute];
    });
}

/**
 * Shortcut method, because it is used too often
 */
function getUserFirstName(psuid) {
    return userAttribute(psuid, 'name');
}

const init = (obj) => {
    profiles = obj.cloudant.db.use('profiles-sofy');
    return Promise.resolve();
};

module.exports = {
    getUser: getUser,
    init,
    putUser: putUser,
    userAttribute: userAttribute,
    getUserFirstName: getUserFirstName,
    validateUniqueIdentification: validateUniqueIdentification
};
