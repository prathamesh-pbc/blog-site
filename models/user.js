
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  userName: String,
  details: String,
  secret: [String]
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
