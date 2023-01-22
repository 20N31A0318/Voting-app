"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class options extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      options.belongsTo(models.Questions, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });
    }

    static addOption({ title, questionId }) {
      return this.create({ optionTitle: title, questionId });
    }
  }
  options.init(
    {
      optionTitle: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "options",
    }
  );
  return options;
};
