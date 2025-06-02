const Sequelize = require('sequelize');
const sequelize = require('../config/DBConfig');
const db = require('../config/DBConfig');

const Featureds = db.define('featured', {
    fImage: {
        type: Sequelize.STRING
    },
    fName: {
        type: Sequelize.STRING
    },
    fPrice: {
        type: Sequelize.DOUBLE
    }
});

module.exports = Featureds;