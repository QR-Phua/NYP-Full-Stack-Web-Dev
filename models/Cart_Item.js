const Sequelize = require('sequelize');
const sequelize = require('../config/DBConfig');
const db = require('../config/DBConfig');

const Cart_Item= db.define('cart_item', {
    cart_ID: {
        type: Sequelize.STRING
    },
    product_Name: {
        type: Sequelize.STRING
    },
    product_Description: {
        type: Sequelize.STRING
    },
    price: {
        type: Sequelize.STRING
    },
    dimensions: {
        type: Sequelize.STRING
    },
    quantity: {
        type: Sequelize.INTEGER
    },
    image: {
        type: Sequelize.STRING
    }
    
});

module.exports = Cart_Item;