var express = require('express');
var passport = require('passport');
var Level = require('../models/level');
var router = express.Router();

function requireLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

module.exports = router;