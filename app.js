require('dotenv').config()
const express = require ('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const _ = require('lodash');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const multer = require('multer');
const User = require("./models/user");
const Blogpost = require("./models/blogpost");
const Com = require("./models/coms");


//-------------here multer is customised as per needs of file type and size-----------


const app = express()

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.use(session({
  secret: "out little secrets",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

let indexRoute = require("./routes/index")

mongoose.connect('mongodb+srv://Admin:YourName123@cluster0.lamyf.mongodb.net/postsDB', function() {
  console.log("Database is connected successfully.");
});

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
app.use("/", indexRoute);

//---------------------------------------------------------------------------------server listening function------------------------

app.listen(process.env.PORT || 3000, () => {
  console.log('app is listening on port 3000')
})
