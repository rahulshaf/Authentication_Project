//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
//const encrypt = require('mongoose-encryption')
//const md5 = require('md5'); 
//const bcrypt = require('bcrypt');
//const saltRounds = 10;

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


//Google Authntication___________
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate= require('mongoose-findorcreate')
//__________________________________________________________________________

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

app.use(session({
  secret: 'my secure String',
  resave: false,
  saveUninitialized: true,
}))
app.use(passport.initialize());
app.use(passport.session());

//Data_Base_
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});

//mongoose.set("useCreateIndex",true);
const UserSchema= new mongoose.Schema({
    username:String,
    password:String,
    googleId:String,
    secret:String
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);//Goole_Authentication_Plugin

//UserSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

const User= mongoose.model("User",UserSchema);

passport.use(User.createStrategy());
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(User, done) {
  done(null, User);
});

passport.deserializeUser(function(User, done) {
  done(null, User);
});


//Google_Authentication_setup______________________________________________

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOne({googleId:profile.id}).then(function(user){
        if(user){
            console.log(profile.email+" user sucessfully login by google authentication");
            return done(null,user);
        }
        else
        {
            const newUser = new User({
                googleId:profile.id,
                username:profile.email
            })
            newUser.save().then(function(){
                console.log(profile.email+" new user sucessfully register and login by google authentication");
                return done(null,newUser)
            }).catch(function(err){
                return done(err,newUser);
            })
        }
    }).catch(function(err){
        return done(err,null)
    })
    /*User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });*/
   
  }
));
//________________________________________________________________________


//____________________________________________main code_______________________________________
app.get("/",function(req,res){
    res.render("home")
});

//Google_Authentication_code________________________________________________________
app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secret',
        failureRedirect: '/login'
}));

//____________________________________________________________________________________
app.get("/login",function(req,res){
    res.render("login")
})
app.get("/register",function(req,res){
    res.render("register")
})
app.get("/secret",function(req,res){
    if(req.isAuthenticated()){
        User.find({secret:{$ne:null}}).then(function(foundUsers){
                res.render("secrets",{
                    Users:foundUsers
            })
        }).catch(function(err){
            console.log(err);
        })
    }
    else {
        res.redirect("/login")
    }
})

//submit secrete_________________________________________________
app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit")
    }
    else
        res.redirect("/login");
})

app.post("/submit",function(req,res){
    User.findById(req.user._id).then(function(founduser){
            founduser.secret=req.body.secret;
            founduser.save().then(function(){
                res.redirect("/secret")
            }).catch(function(err){
                console.log(err)
            })
    }).catch(function(err){
        console.log(err);
    })
})

//____________________________________________________________
app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err)
            console.log(err)
        else{
            console.log("sucessfully logout")
            res.redirect("/")
        }
    });
    
})

app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,User){
        if(err)
            console.log(err)
        else
        {
            
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secret")
            })
        }
    })



})
app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user,function(err){
        if(err)
            console.log(err);
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secret")
            })
        }

    })

})


/*app.post("/register",function(req,res){
    bcrypt.hash(req.body.password, saltRounds).then(function(hashPassword) {
         const newUser= new User({
        username:req.body.username,
        password:hashPassword
    })
    newUser.save().then(function(){
        res.render("secrets")
    }).catch(function(err){
        console.log(err)
    })
    
});

   
})

app.post("/login",function(req,res){
    const username= req.body.username;
    const password= req.body.password;

    
    
    User.findOne({username:username}).then(function(foundUser){
        if(foundUser){
            bcrypt.compare(password, foundUser.password).then(function(result) {
                if(result)
                    res.render("secrets")
                else
                    res.send("Invalid Password")

            });
        }
        else {
            res.send("Invalid UserName")
        }
    }).catch(function(err){
        console.log(err);
    });
})*/

//_____________________________________________listen_________________________________________
app.listen(3000,function(){
    console.log("server started at port 3000")
})