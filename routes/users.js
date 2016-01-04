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

router.get('/:username', requireLogin, function(req, res) {
  if (req.params.username != req.user.username) {
    res.redirect('/users/' + req.user.username);
  } else {
    res.render('profile', {
      user: req.user
    });
  }
});

module.exports = router;