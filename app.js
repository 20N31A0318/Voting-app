/* eslint-disable no-unused-vars */
const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const path = require("path");
app.set("views", path.join(__dirname, "views"));
//the below code of body parser is used to parse the "request.body" in the post request.
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const { elections, User, Questions, QuestionOptions } = require("./models");
const { PassThrough } = require("stream");

const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("12345678912345678912345678912345", ["POST", "PUT"]));
app.use(flash());

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "idk-why-i-have-to-put-in-this-secret-code-3479304573",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60,
    },
  })
);

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          if (!user) {
            return done(null, false, { message: "Invalid username" });
          }
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return error;
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async (request, response) => {
  if (request.user && request.user.id) {
    response.redirect("/elections");
  } else {
    response.render("index", {
      title: "Vote it out",
      csrfToken: request.csrfToken(),
    });
  }
});

app.get(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const UserWhoIsLoggedin = request.user.id;
    console.log(UserWhoIsLoggedin);
    const previous = await elections.completedItems(UserWhoIsLoggedin);
    const onGoing = await elections.inCompleteItems(UserWhoIsLoggedin);
    if (request.accepts("html")) {
      response.render("elections", {
        title: "Vote it out",
        previous,
        onGoing,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        previous,
        onGoing,
      });
    }
  }
);

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/elections");
    });
  } catch (error) {
    error.errors.forEach((element) => {
      request.flash("error", element.message);
    });
    response.redirect("signup");
  }
});

app.get("/login", (request, response) => {
  try {
    response.render("login", {
      title: "Login",
      csrfToken: request.csrfToken(),
    });
  } catch (error) {
    console.log(error);
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    response.redirect("/elections");
  }
);

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get(
  "/allelections",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const users = await elections.getElections(request.user.id);
      return response.json(users);
    } catch (error) {
      return response.status(500).send(error);
    }
  }
);

app.get("/createElection", (request, response) => {
  response.render("createElection", {
    title: "Create new election",
    csrfToken: request.csrfToken(),
  });
});

app.get("/elections/:id", async function (request, response) {
  try {
    const election = await elections.findByPk(request.params.id);
    return response.json(election);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/Election/:id/createQuestions", (request, response) => {
  response.render("createQuestions", {
    title: "Add questions",
    electionId: request.params.id,
    csrfToken: request.csrfToken(),
  });
});

app.get("/addOptions", async (request, response) => {
  response.render("addOptions", {
    title: "Add options",
    questionbody: request.session.addedQuestions, // Get the added questions from the session variable
    csrfToken: request.csrfToken(),
  });
});

// app.post("/submitOptions", async (request, response) => {
//   console.log("Options request body", request.body);
//   try {
//     for (const key in request.body) {
//       if (key.startsWith("q-")) {
//         const questionIDfromRequestBody = key.split("-")[1];
//         console.log(request.body[key])
//         const option = await QuestionOptions.addOption({
//           Title: request.body[key],
//           QueId: questionIDfromRequestBody
//         });
//       }
//     }
//     // Store the added questions in a session variable\
//     return response.redirect(`/addElectors`);
//   } catch (error) {
//     console.log(error);
//     error.errors.forEach((element) => {
//       request.flash("error", element.message);
//     });
//     response.redirect("/addOptions");
//   }
// });

app.post("/submitOptions", async (request, response) => {
  console.log("Options request body", request.body);
  try {
    for (const key in request.body) {
      if (key.startsWith("q-")) {
        const questionIDfromRequestBody = key.split("-")[1];
        const optionIndex = key.split("-")[3];
        const optionValueKey = `q-${questionIDfromRequestBody}-option-${optionIndex}`;
        const optionValue = request.body[optionValueKey];
        console.log(optionValue);
        const option = await QuestionOptions.addOption({
          Title: optionValue,
          QueId: questionIDfromRequestBody
        });
      }
    }
    // Store the added questions in a session variable
    return response.redirect(`/addElectors`);
  } catch (error) {
    console.log(error);
    error.errors.forEach((element) => {
      request.flash("error", element.message);
    });
    response.redirect("/addOptions");
  }
});

app.get("/addElectors", async (request, response) => {
  response.render("addElectors"), {
    title: "Add Electors",
    csrfToken: request.csrfToken(),
  }
})

// app.get("/Election/:id/editQuestions", async (request, response) => {
//   const presentQuestions = await Questions.findOne({
//     where: { electionId: request.params.id },
//   });
//   console.log(presentQuestions);
//   const allOptions = await options.findAll({
//     where: { questionId: presentQuestions.id },
//   });
//   console.log("alloptions are", allOptions);
//   response.render("editQuestions", {
//     optionsbody: allOptions,
//     questionbody: presentQuestions,
//     title: "Edit questions",
//     csrfToken: request.csrfToken(),
//   });
// });

// app.post("/Question/addOptions", async (request, response) => {
//   const addedOptions = request.body;
//   console.log(addedOptions);
//   const optionsLength = Object.keys(addedOptions).length;
//   const presentQuestion = await Questions.findOne({
//     where: { id: request.params.id },
//   });
//   console.log("present question id", presentQuestion);
//   try {
//     for (let i in addedOptions) {
//       if (i === "_csrf") continue;
//       var optionValue = addedOptions[i];
//       await options.addOption({
//         title: optionValue,
//         questionId: request.params.id,
//       });
//     }
//     return response.redirect(
//       `/Election/${presentQuestion.electionId}/editQuestions`
//     );
//   } catch (error) {
//     console.log(error);
//     error.errors.forEach((element) => {
//       request.flash("error", element.message);
//     });
//     response.redirect("/createElection");
//   }
// });

app.post("/Election/:id/addQuestion", async (request, response) => {
  console.log("Question request body", request.body);
  try {
    let questions = []; // Array to store added questions
    for (const key in request.body) {
      if (key.startsWith("question-")) {
        const index = key.split("-")[1];
        const question = await Questions.addQuestion({
          question: request.body[`question-${index}`],
          description: request.body[`description-${index}`],
          electionId: request.params.id,
        });
        questions.push(question); // Add the added question to the array
      }
    }
    console.log("idk questions are", questions)
    // Store the added questions in a session variable
    request.session.addedQuestions = questions;
    return response.redirect(`/addOptions`);
  } catch (error) {
    console.log(error);
    error.errors.forEach((element) => {
      request.flash("error", element.message);
    });
    response.redirect("/createElection");
  }
});

app.post(
  "/createElection",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Creating a election", request.body);
    try {
      const election = await elections.addElection({
        title: request.body.title,
        completed: false,
        userId: request.user.id,
      });
      const newElection = await elections.findOne({
        where: { title: request.body.title },
      });
      console.log("New election is :", newElection);
      return response.redirect(`/Election/${newElection.id}/createQuestions`);
    } catch (error) {
      console.log(error);
      error.errors.forEach((element) => {
        request.flash("error", element.message);
      });
      response.redirect("/createElection");
    }
  }
);

app.put(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const Election = await elections.findByPk(request.params.id);
    const completed = request.body.completed;
    try {
      const updatedElection = await Election.setElectionUpdationStatus(
        completed === true,
        request.user.id
      );
      return response.json(updatedElection);
    } catch (error) {
      console.log(error);
      return response.status(404).json(error);
    }
  }
);

// app.put(
//   "/updateQuestion/:id/:questionId",
//   connectEnsureLogin.ensureLoggedIn(),
//   async (request, response) => {
//     const Election = await elections.findByPk(request.params.id);
//     const Question = await questions.findByPk(request.params.questionId)
//     const questionEdit = request.body.edit;
//     try {
//       const updatedQuestion = await Question.updateQuestion(
//         request.user.id,
//         request.user.questionId
//       );
//       return response.json(updatedElection);
//     } catch (error) {
//       console.log(error);
//       return response.status(404).json(error);
//     }
//   }
// );

app.get(
  "/ViewResults",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    response.render("ViewResults", {
      title: "Results",
      csrfToken: request.csrfToken(),
    });
  }
);

app.delete(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, resposne) => {
    try {
      const election = await elections.findByPk(request.params.id);
      console.log("id from url is", request.params.id),
        await election.removeElection(request.user.id);
      return resposne.json({ success: true });
    } catch (error) {
      console.log("id from url is", request.params.id);
      return resposne.status(404).json({ success: true });
    }
  }
);

module.exports = app;
