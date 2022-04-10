
const mongoose = require('mongoose');


const postSchema = new mongoose.Schema({
  frontImage: Buffer,
  name: String,
  category: String,
  content: String,
  writer: String,
  mail: String,
  about: String,
  comments: [String]
});

module.exports = mongoose.model('Blogpost', postSchema);
