/**
 * Standard model for a user account.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
  username: String,
  firstname: String,
  lastname: String,
  email: String,
  school: String,
  password: String
});

var options = {
  errorMessages: {
    MissingPasswordError: "Password required",
    IncorrectPasswordError: "Username or password incorrect",
    IncorrectUsernameError: "Username or password incorrect",
    MissingUsernameError: "Username required",
    UserExistsError: "Username already in use"
  }
}

Account.plugin(passportLocalMongoose, options);

module.exports = mongoose.model('Account', Account);