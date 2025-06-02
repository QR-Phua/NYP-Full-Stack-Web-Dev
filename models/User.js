const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const User = db.define('user', {
    username: {
        type: Sequelize.STRING
    },
    name: {
        type: Sequelize.STRING
    },
    contact: {
        type: Sequelize.INTEGER
    },
    address: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    sid: {
        type: Sequelize.STRING
    },
    pid: {
        type: Sequelize.STRING
    },
    role:{
        type: Sequelize.STRING
    },
    verified:{
        type: Sequelize.BOOLEAN
    },
});
module.exports = User;