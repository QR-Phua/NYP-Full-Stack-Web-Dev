const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database. 
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Deal = db.define('deal', { 
supname: {
    type: Sequelize.STRING
},
countrydollar: {
    type: Sequelize.STRING
},
supprice: {
    type: Sequelize.DECIMAL(10,2)
},
supamt: {
    type: Sequelize.INTEGER
},
sgdprice: {
    type: Sequelize.DECIMAL(10,2)
},
supdate: {
    type: Sequelize.DATE
},
sgdtotal: {
    type: Sequelize.DECIMAL(10,2)
},
});
module.exports = Deal;