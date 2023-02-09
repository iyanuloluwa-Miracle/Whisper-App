//jshint esversion:6
//important you put it at the top of the screen
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//required for encryption for level2
//const encrypt = require("mongoose-encryption")
//required for level 3 security
//const md5 = require('md5')
//using bcrypt for level 4 security
//const bcrypt = require("bcrypt")
//const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//For  very important the authentication
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
const port = process.env.PORT || 3001;
//console.log(md5("1234567890"))
//console.log(process.env.API_KEY)

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "Our little Secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

//connecting to the database
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

//mongoose.set("useCreateIndex", true)

//Basic Data base Schema
//const userSchema = {
//  email: String,
//  password: String
//}

//levelling up especially when authentication is involved
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//Model
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRETS,
      callbackURL: "http://localhost:8001/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

//for level 2 encryption
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']})

//Routing home
app.get("/", function (req, res) {
  res.render("home");
});

//using
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  }
);

//Routing to login
app.get("/login", function (req, res) {
  res.render("login");
});

//Routing to register
app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  User.find({ secrets: { $ne: null } }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        res.render("secrets", { usersWithSecrets: foundUser });
      }
    }
  });
});

app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

//Dealing with the basic database
//app.post("/register", function(req, res){
//  bcrypt.hash(req.body.password, saltRounds, function(err, hash){
//    const newUser = new User({
//      email: req.body.username,
//      password: hash
//    })
//    newUser.save(function(err){
//      if(err){
//        console.log(err)
//      }else{
//        res.render("secrets")
//
//      }
//    })
//  })

//})

//for md 5 authentication
//app.post("/register", function(req, res){

//  const newUser = new User({
//    email: req.body.username,
//    password: md5(req.body.password)
//  })
//  newUser.save(function(err){
//    if(err){
//      console.log(err)
//    }else{
//      res.render("secrets")

//    }
//  })
//})

//Dealing with routing when u log in
//app.post("/login", function(req, res){
//  const username = req.body.username
//  const password = md5(req.body.password)

//  User.findOne({email:username}, function(err, foundUser){
//    if (err){
//      console.log(err)
//    }else{
//     if(foundUser){
//        bcrypt.compare(password, foundUser.password, function(err, result){

//          if(result === true){
//            res.render("secrets")

//          }

//        })
//        //if (foundUser.password === password){

//        }

//      }

//  })
//})

//Logout Button

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

//submit route

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.post("/submit", function (req, res) {
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function () {
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
