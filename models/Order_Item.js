const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Order_Item = db.define('order_item', {

    product_Name: {
        type: Sequelize.STRING
    },
    product_Description: {
        type: Sequelize.STRING
    },
    price: {
        type: Sequelize.DOUBLE
    },
    dimensions: {
        type: Sequelize.STRING
    },
    quantity: {
        type: Sequelize.INTEGER
    },
    image: {
        type: Sequelize.STRING
    },
    order_ID: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING
    }

});

module.exports = Order_Item;