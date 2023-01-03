//jshint esversion:6
const express = require('express');
const bodyParser = require("body-parser")
const ejs = require("ejs");
const mongoose = require("mongoose")
const encrypt = require("mongoose-encryption")

const app = express();
app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended:true
}))
//connecting to the database
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser: true})

//Basic Data base Schema
//const userSchema = {
//  email: String,
//  password: String
//}
//levelling up especially when authentication is involved
const userSchema = new mongoose.Schema({
  email: String,
  password: String
})


const secret = "This is our littlesecret."
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']})



//Model 
const User = new mongoose.model("User", userSchema)


//Routing home
app.get("/", function(req, res){
    res.render("home")
})


//Routing to login
app.get("/login", function(req, res){
    res.render("login")
})

//Routing to register
app.get("/register", function(req, res){
    res.render("register")
})


//Dealing with the basic database
app.post("/register", function(req, res){
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  })
  newUser.save(function(err){
    if(err){
      console.log(err)
    }else{
      res.render("secrets")

    }
  })
})

//Dealing with routing when u log in
app.post("/login", function(req, res){
  const username = req.body.username
  const password = req.body.password

  User.findOne({email:username}, function(err, foundUser){
    if (err){
      console.log(err)
    }else{
      if(foundUser){
        if (foundUser.password === password){
          res.render("secrets")
        }

      }

    }
      
    
  })
})


app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(8000, () => {
  console.log('Server listening on port 8000');
});
