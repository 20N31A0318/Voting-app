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
      elections.belongsTo(models.User, {
        foreignKey: "userId",
      });
      // define association here
    }

    static addElection({ title, userId }) {
      return this.create({ title: title, completed: false, userId });
    }

    static getElections(userId) {
      return this.findAll({
        where: {
          userId,
        },
      });
    }

    static completedItems(userId) {
      return this.findAll({
        where: {
          completed: true,
          userId,
        },

        // order: [["id", "ASC"]],
      });
    }

    static inCompleteItems(userId) {
      return this.findAll({
        where: {
          completed: false,
          userId,
        },

        // order: [["id", "ASC"]],
      });
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
