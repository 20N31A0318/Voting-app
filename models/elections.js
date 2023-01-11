/* eslint-disable no-unused-vars */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class elections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static addElection({ title }) {
      return this.create({ title: title, completed: false });
    }

    static getElections() {
      return this.findAll();
    }

    static getElection(userId) {
      return this.findAll({
        order: [["id", "ASC"]],
        where: {
          userId,
        },
      });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }
  }
  elections.init(
    {
      title: DataTypes.STRING,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "elections",
    }
  );
  return elections;
};
