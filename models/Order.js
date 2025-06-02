const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Order = db.define('order', {
    order_ID: {
        type: Sequelize.STRING
    },
    user_ID: {
        type: Sequelize.STRING
    },
    order_Subtotal: {
        type: Sequelize.DOUBLE
    },
    discount_Amount: {
        type: Sequelize.DOUBLE
    },
    shipping_Amount: {
        type: Sequelize.DOUBLE
    },
    shipping_Type: {
        type: Sequelize.STRING
    },
    order_Total: {
        type: Sequelize.DOUBLE
    },

    first_Name : {
        type: Sequelize.STRING
    },
    last_Name : {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    phone: {
        type: Sequelize.STRING
    },
    address: {
        type: Sequelize.STRING
    },
    apartment: {
        type: Sequelize.STRING
    },
    city : {
        type: Sequelize.STRING
    },
    country : {
        type: Sequelize.STRING
    },
    post_Code: {
        type: Sequelize.STRING
    },
    
    card_Number: {
        type: Sequelize.STRING
    },
    payment_Type: {
        type: Sequelize.STRING
    },
    discount_Code: {
        type: Sequelize.STRING
    },
    timestamp: {
        type: Sequelize.STRING
    },
    paymentMethod_ID: {
        type: Sequelize.STRING
    }


});

module.exports = Order;
