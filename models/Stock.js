const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Stock = db.define('stock', {
    stkstatus: {
        type: Sequelize.STRING
    },
    bizname: {
        type: Sequelize.STRING
    },
    stkamt: {
        type: Sequelize.INTEGER
    },
    stktotalcost: {
        type: Sequelize.DECIMAL(10,2)
    },
    stkdate: {
        type: Sequelize.DATE
    },
    leftover: {
        type: Sequelize.INTEGER
    }
});

module.exports = Stock;