'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QuestionOptions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      QuestionOptions.belongsTo(models.Questions,{
        foreignKey:"QueId",
        onDelete:"CASCADE"
      })
    }

    static addOption({title,QueId}){
      return this.create({Title:title,QueId})
    }
  }
  QuestionOptions.init({
    Title: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'QuestionOptions',
  });
  return QuestionOptions;
};