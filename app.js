/* eslint-disable no-unused-vars */
const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const path = require("path");
//the below code of body parser is used to parse the "request.body" in the post request.
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const { elections, User } = require("./models");

const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("12345678912345678912345678912345", ["POST", "PUT"]));

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "my-super-secret-key-3479304573",
    cookie: {
      maxAge: 24 * 60 * 60,
    },
  })
);

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
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done("Invalid Password");
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

const user = require("./models/user");

app.get("/", async (request, response) => {
  response.render("index", {
    title: "Vote it out",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    console.log(loggedInUser);
    const previous = await elections.completedItems(loggedInUser);
    const onGoing = await elections.inCompleteItems(loggedInUser);
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
  console.log(hashedPwd);
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
    console.log(error);
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
  passport.authenticate("local", { failureRedirect: "/login" }),
  (request, response) => {
    try {
      console.log(request.user);
      response.redirect("/elections");
    } catch (error) {
      console.log(error);
    }
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

// app.get("/elections", async (request, response) => {
//   console.log("Elections");
//   try {
//     const election = await elections.findAll();
//     return response.send(election);
//   } catch (error) {
//     console.log(error);
//     return response.status(422).json(error);
//   }
// });

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

app.get("/elections/:id", async function (request, response) {
  try {
    const election = await elections.findByPk(request.params.id);
    return response.json(election);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Creating a election", request.body);
    console.log(request.user);
    try {
      await elections.addElection({
        title: request.body.title,
        completed: false,
        userId: request.user.id,
      });
      return response.redirect("/elections");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/elections/:id/updateElection",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Update a election:", request.params.id);
    const Election = await elections.findByPk(request.params.id);
    try {
      const updatedELection = await Election.markAsCompleted();
      return response.json(updatedELection);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

// app.delete("/todos/:id", (request, response) => {
//     console.log("Delete a question by id:", request.params.id)
// })

module.exports = app;
