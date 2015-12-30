/**
 * Standard model for a level.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Level = new Schema({
  title: String,
  level: String,
  comment: String,
  hashed_answer: String
});

module.exports = mongoose.model('Level', Account);