//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require("express-session")
const passport = require ("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const app = express();

app.use(express.static("public"))
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({
    extended:true
}))

app.use(session({
    secret:"Our little secret",
    resave:false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
// Connect to the MongoDB database using mongoose.connect()
mongoose.connect( 'mongodb://0.0.0.0:27017/userDB', { useNewUrlParser: true, connectTimeoutMS: 30000 })
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

  


  const userSchema = new mongoose.Schema({

    email: String,
    password: String,
    googleId: String,
   secret: [{type:String}]
  
  });
userSchema.plugin(passportLocalMongoose)



 const User = new mongoose.model("User",userSchema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
 passport.deserializeUser(User.deserializeUser());


app.get( "/" , async function(req,res){
    res.render("home")
})


app.get( "/login" , async function(req,res){
    res.render("login")
})


app.get( "/register" , async function(req,res){
  res.render("register")
});

//  This is Method-1

// app.get("/secrets", async function(req,res){
  
//   if(req.isAuthenticated()){
//   try{
//     const foundUser = await User.find({ "secret": { $ne: null } });
//     if (foundUser){
//       res.render("secrets",{usersWithSecrets:foundUser});
//     }

//   }catch (err) {
//     console.log(err);
//   }}else{
//     res.redirect("/login")
//   }
// });

// This is Method-2
app.get("/secrets",function(req,res){
  User.find({"secret":{$ne:null}})
  .then(function (foundUsers) {
    res.render("secrets",{usersWithSecrets:foundUsers});
    })
  .catch(function (err) {
    console.log(err);
    })
});

app.get("/secrets",function(req,res){
    if (req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.redirect("/login")
    }
})


app.get("/submit",function(req,res){
  if (req.isAuthenticated()){
      res.render("submit")
  }else{
      res.redirect("/login")
  }
})


app.post("/submit", async function(req, res) {
  const submittedSecret = req.body.secret;
  console.log(req.user.id);

  try {
    const foundUser = await User.findById(req.user.id);
    if (foundUser) {
      foundUser.secret.push(submittedSecret); // Assuming 'secret' is an array
      await foundUser.save();
      res.redirect("/secrets");
    }
  } catch (err) {
    console.log(err);
  }
});

  
app.post("/register", function(req, res) {
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
        console.log(err);
        res.render("register"); // Render the registration page with an error message
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets"); // Redirect to the secrets page upon successful registration
        });
    }
});
});
  
app.post("/login", passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login"
}));


app.get("/logout", function(req, res) {
    req.logout(function(err) {
      if (err) {
        console.error(err);
      }
      res.redirect("/");
    });
  });
  

app.listen(3000,function() {
console.log("Server is runing on port 3000")
})