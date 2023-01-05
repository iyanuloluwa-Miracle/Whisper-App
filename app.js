//jshint esversion:6
//important you put it at the top of the screen
require('dotenv').config()
const express = require('express');
const bodyParser = require("body-parser")
const ejs = require("ejs");
const mongoose = require("mongoose")
//required for encryption for level2
//const encrypt = require("mongoose-encryption")
//required for level 3 security
//const md5 = require('md5')


const app = express();
//console.log(md5("1234567890"))
//console.log(process.env.API_KEY)

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

//for level 2 encryption
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']})



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
    password: md5(req.body.password)
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
  const password = md5(req.body.password)

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
