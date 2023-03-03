// connectDB.js

const Sequelize = require("sequelize");

const database = "owndevvoter_db";
const username = "postgres";
const password = "hemanth22122";
const sequelize = new Sequelize(database, username, password, {
  host: "localhost",
  dialect: "postgres",
});

const connect = async () => {
    return sequelize.authenticate();
  }
  
  module.exports = {
    connect,
    sequelize
  }
