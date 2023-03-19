'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("QuestionOptions","QueId",{
      type:Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint("QuestionOptions",{
      fields:['QueId'],
      type:'foreign key',
      references:{
        table:"Questions",
        field:'id'
      }
    })
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("QuestionOptions","QueId")
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
