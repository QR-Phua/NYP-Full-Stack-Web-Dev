const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database. 
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Inventory = db.define('inventory', { 
    prodname: {
        type: Sequelize.STRING
    },
    proddesc: {
        type: Sequelize.STRING
    },
    prodqty: {
        type: Sequelize.INTEGER
    },
});
module.exports = Inventory;