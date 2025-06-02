const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Shopping_Cart = db.define('shopping_cart', {
    cart_ID: {
        type: Sequelize.STRING
    }
});

module.exports = Shopping_Cart;