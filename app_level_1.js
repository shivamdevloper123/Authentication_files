//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');

const app = express();

app.use(express.static("public"))
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({
    extended:true
}))

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
    password:String
});




const User = new mongoose.model("User",userSchema)

app.get( "/" , async function(req,res){
    res.render("home")
})


app.get( "/login" , async function(req,res){
    res.render("login")
})


app.get( "/register" , async function(req,res){
    res.render("register")
})

app.post("/register",function(req,res){
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    })
    newUser
           .save()
          
           .then(() => {
               res.render("secrets")
             })
          .catch((err) => {
            console.error(err);
          });
    });

app.post("/login",(req,res)=>{
const username = req.body.username;
const password = req.body.password;
User.findOne({email:username})
    .then((foundUser)=>{
        if(foundUser){
            if(foundUser.password === password){
                res.render("secrets")
            }
        }
    })
    //When there are errors we handle them her 
    .catch((err)=>{
        console.log(err)
    })

});

app.listen(3000,function() {
console.log("Server is runing on port 3000")
})