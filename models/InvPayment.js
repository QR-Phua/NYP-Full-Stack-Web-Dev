const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database. 
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const InvPayment = db.define('invpayment', { 
supdate: {
    type: Sequelize.DATE
},
PayType: {
    type: Sequelize.STRING
},
ComPayName: {
    type: Sequelize.STRING
},
ComPayAddress: {
    type: Sequelize.STRING
},
ComPayZipcode: {
    type: Sequelize.STRING
},
SupPayName: {
    type: Sequelize.STRING
},
SupPayAddress: {
    type: Sequelize.STRING
},
SupPayZipcode: {
    type: Sequelize.STRING
},
PayPrice: {
    type: Sequelize.DECIMAL(10,2)
},
PayAmt: {
    type: Sequelize.INTEGER
},
PayTotal: {
    type: Sequelize.DECIMAL(10,2)
},
Status: {
    type: Sequelize.STRING
},
});
module.exports = InvPayment;