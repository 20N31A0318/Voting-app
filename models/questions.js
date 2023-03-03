"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Questions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Questions.belongsTo(models.elections, {
        foreignKey: "electionId",
      });

      Questions.hasMany(models.options, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });
    }

    updateQuestion(edit, userId, questionId) {
      if (this.userId === userId && this.questionId === questionId) {
        return this.update({
          question: edit,
        });
      } else {
        throw new Error("Unauthorized");
      }
    }

    static addQuestion({ question, description, electionId }) {
      return this.create({
        question: question,
        description: description,
        electionId,
      });
    }
  }
  Questions.init(
    {
      question: DataTypes.STRING,
      description: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Questions",
    }
  );
  return Questions;
};
