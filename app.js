//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption')

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

//Data_Base_
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});
const UserSchema= new mongoose.Schema({
    username:String,
    password:String
});

UserSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

const User= mongoose.model("User",UserSchema);


//____________________________________________main code_______________________________________
app.get("/",function(req,res){
    res.render("home")
});
app.get("/login",function(req,res){
    res.render("login")
})
app.get("/register",function(req,res){
    res.render("register")
})

app.post("/register",function(req,res){
    const newUser= new User({
        username:req.body.username,
        password:req.body.password
    })
    newUser.save().then(function(){
        res.render("secrets")
    }).catch(function(err){
        console.log(err)
    })
})

app.post("/login",function(req,res){
    const username= req.body.username;
    const password= req.body.password;
    User.findOne({username:username}).then(function(foundUser){
        if(foundUser){
            if(foundUser.password===password)
                res.render("secrets")
            else
                res.send("Invalid Password")
        }
        else {
            res.send("Invalid UserName")
        }
    }).catch(function(err){
        console.log(err);
    });
})

//_____________________________________________listen_________________________________________
app.listen(3000,function(){
    console.log("server started at port 3000")
})