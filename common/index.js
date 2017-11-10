/*
Bancolombia 2017
 */
'use strict';
const config = global.__configuration,
    DAOCloudant = require('../DAO');

const userProfile = require('../DAO/modules/userProfileDAO'),
    _ = require('lodash');

_.templateSettings = {
    interpolate: /\{(\w+?)\}/g
};

//Set profileDAO obj
const mod = {
    module:'userProfileDAO'
}; 
DAOCloudant.callOperation(mod);

const appendToUrl = (url, resource) => {
    let l = url.length;
    if (resource[0] === '/')
        resource = resource.substring(1);
    return (url[l - 1] === '/') ?
        url + resource :
        url + '/' + resource;
};

module.exports = {
    appendToUrl,
};
