/**
 * Standard model for a level.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Level = new Schema({
  level: Number,
  clue1: String,
  clue2: String,
  imagePath: String,
  title: String,
  comment: String,
  hashed_answer: String
});

module.exports = mongoose.model('Level', Level);