
//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require("express-session")
const passport = require ("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate')
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
    email:String,
    password:String,
    facebookId: String
});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)


 const User = new mongoose.model("User",userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    })
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

  
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));
     


app.get( "/" , async function(req,res){
    res.render("home")
})

app.get("/auth/facebook",
 
    passport.authenticate("facebook")
 
  );
 
 app.get("/auth/facebook/secrets",
 
    passport.authenticate("facebook", { failureRedirect: "/login" }),
 
    function(req, res) {
 // Successful authentication, redirect home.
           res.redirect("/secrets");
  });


app.get( "/login" , async function(req,res){
    res.render("login")
})


app.get( "/register" , async function(req,res){
    res.render("register")
})

app.get("/secrets",function(req,res){
    if (req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.redirect("/login")
    }
})




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