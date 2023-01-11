/* eslint-disable no-unused-vars */
const request = require("supertest");
const db = require("../models/index");
const app = require("../app");

let server, agent;

describe("Election test suite", () => {
  //opening a database server
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });
  //closing a database server
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("responds with json at /elections", async () => {
    const response = await agent.post("/elections").send({
      title: "President election",
      completed: false,
    });
    expect(response.statusCode).toBe(200);
    expect(response.header["content-type"]).toBe(
      "application/json; charset=utf-8"
    );
    const parsedResponse = JSON.parse(response.text);
    expect(parsedResponse.id).toBeDefined();
  });

  test("Mark an election as complete", async () => {
    const response = await agent.post("/elections").send({
      title: "President election",
      completed: false,
    });

    const parsedResponse = JSON.parse(response.text);
    const electionID = parsedResponse.id;

    expect(parsedResponse.completed).toBe(false);

    const markCompleteResponse = await agent
      .put(`/elections/${electionID}/updateElection`)
      .send();
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
    console.log(parsedUpdateResponse);
  });

  test("Fetches all elections in the database using /elections endpoint", async () => {
    await agent.post("/elections").send({
      title: "Class election",
      completed: false,
    });
    await agent.post("/elections").send({
      title: "Student election",
      completed: false,
    });
    const response = await agent.get("/elections");
    const parsedResponse = JSON.parse(response.text);
    console.log(parsedResponse);
    expect(parsedResponse.length).toBe(4);
    expect(parsedResponse[3]["title"]).toBe("Student election");
  });
});
