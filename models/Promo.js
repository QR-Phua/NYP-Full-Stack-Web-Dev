const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Promo = db.define('promo', {
    code: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING
    },
    discount: {
        type: Sequelize.STRING
    },
    target: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING
    }
});

module.exports = Promo;