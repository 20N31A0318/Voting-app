/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const path = require("path");
//the below code of body parser is used to parse the "request.body" in the post request.
const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

const { elections } = require("./models");
app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  const allElections = await elections.getElections();
  if (request.accepts("html")) {
    response.render("index", {
      allElections,
    });
  } else {
    response.json({
      allElections,
    });
  }
});

app.get("/elections", async (request, response) => {
  console.log("Elections");
  try {
    const election = await elections.findAll();
    return response.send(election);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/elections", async (request, response) => {
  console.log("Creating a election", request.body);
  try {
    const Election = await elections.addElection({
      title: request.body.title,
      completed: false,
    });
    return response.json(Election);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/elections/:id/updateElection", async (request, response) => {
  console.log("Update a election:", request.params.id);
  const Election = await elections.findByPk(request.params.id);
  try {
    const updatedELection = await Election.markAsCompleted();
    return response.json(updatedELection);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// app.delete("/todos/:id", (request, response) => {
//     console.log("Delete a question by id:", request.params.id)
// })

module.exports = app;
