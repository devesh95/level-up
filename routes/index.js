var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    user: req.user
  });
});

router.get('/register', function(req, res) {
  res.render('register', {});
});

router.post('/register', function(req, res) {
  Account.register(new Account({
    username: req.body.username,
    firstname: req.body.firstname,
    email: req.body.email,
    lastname: req.body.lastname,
    school: req.body.school,
    current_level: 0
  }), req.body.password, function(err, account) {
    if (err) {
      return res.render('register', {
        info: err.message
      });
    }

    passport.authenticate('local')(req, res, function() {
      // on login, redirect to profile page
      res.redirect('/users/' + req.user.username);
    });
  });
});

router.get('/login', function(req, res) {
  res.render('login');
});

function requireLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

router.post('/login', passport.authenticate('local'), function(req, res) {
  // on login, redirect to profile page
  res.redirect('/users/' + req.user.username);
});

router.get('/play', requireLogin, function(req, res) {
  // TODO: complete
});

/**
 * Logs out the user
 */
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;