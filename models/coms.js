const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const commentSchema = new mongoose.Schema({
  postId:String,
  text:String,
  posterId:String,
  posterName:String
})

module.exports = mongoose.model('Com', commentSchema);
