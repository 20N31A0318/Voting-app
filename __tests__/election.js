/* eslint-disable no-unused-vars */
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

// const { parse } = require("pg-protocol");
// const { util } = require("prettier");

let server, agent;

const extractCSRFToken = (html) => {
  const $ = cheerio.load(html);
  return $("[name=_csrf]").val();
};

const login = async (agentt, email, password) => {
  const res = await agentt.get("/login");
  const csrfToken = extractCSRFToken(res.text);
  const a = await agentt.post("/session").send({
    email,
    password,
    _csrf: csrfToken,
  });
  console.log(a.statusCode);
  return a;
};

describe("Election test suite", () => {
  //opening a database server
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(5500, () => {});
    agent = request.agent(server);
  });
  //closing a database server
  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign up", async () => {
    let res = await agent.get("/login");
    let csrfToken = extractCSRFToken(res.text);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "password",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
    res = await agent.get("/login");
    csrfToken = extractCSRFToken(res.text);
    res = await agent.post("/users").send({
      firstName: "Akss",
      lastName: "D",
      email: "user123@example.com",
      password: "123456789",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
  });

  test("creates an election", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "password");
    const { text } = await agent.get("/elections");
    const csrfToken = extractCSRFToken(text);

    const response = await agent.post("/elections").send({
      title: "President election",
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Mark an election as complete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "password");
    let res = await agent.get("/elections");
    let csrfToken = extractCSRFToken(res.text);
    await agent.post("/elections").send({
      title: "Non-President election",
      completed: false,
      _csrf: csrfToken,
    });

    const groupedElectionsResponse = await agent
      .get("/allelections")
      .set("Accept", "application/json");
    console.log(groupedElectionsResponse);
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    console.log(parsedGroupedResponse);
    const electionCount = parsedGroupedResponse.length;
    const latestElection = parsedGroupedResponse[electionCount - 1];

    res = await agent.get("/elections");
    csrfToken = extractCSRFToken(res.text);

    const markCompleteResponse = await agent
      .put(`/elections/${latestElection.id}/updateElection`)
      .send({
        _csrf: csrfToken,
      });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  // test("Fetches all elections in the database using /elections endpoint", async () => {
  //   await agent.post("/elections").send({
  //     title: "Class election",
  //     completed: false,
  //   });
  //   await agent.post("/elections").send({
  //     title: "Student election",
  //     completed: false,
  //   });
  //   const response = await agent.get("/elections");
  //   const parsedResponse = JSON.parse(response.text);
  //   console.log(parsedResponse);
  //   expect(parsedResponse.length).toBe(3);
  //   expect(parsedResponse[3]["title"]).toBe("Student election");
  // });
});
