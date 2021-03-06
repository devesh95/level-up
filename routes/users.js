var express = require('express');
var passport = require('passport');
var Level = require('../models/level');
var Account = require('../models/account');
var router = express.Router();

function requireLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

function requireAdminLogin(req, res, next) {
  if (req.user && req.user.username == 'admin') {
    next();
  } else {
    console.log('ERROR: Trying to access admin resources with insufficient privileges.');
    console.log('Trespasser:');
    if (!req.user) {
      console.log('Isn\'t signed in');
    } else {
      console.log(req.user.username + '; email: ' + req.user.email + '; timestamp (unix ms): ' + (new Date()).getTime());
    }
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

router.get('/:user_id/disqualify', requireAdminLogin, function(req, res) {
  Account.findOne({
    _id: req.params.user_id
  }, function(err, user) {
    if (err) {
      console.log(err);
      next(err);
    } else {
      console.log('Disqualifying user ' + user.username + '...');
      user.current_level = '-1';
      user.save(function(saveerr, result) {
        if (saveerr) {
          console.log(saveerr);
          next(saveerr);
        } else {
          console.log('Done!');
          res.redirect('/admin');
        }
      });
    }
  });
});

router.post('/search', requireAdminLogin, function(req, res) {
  if (req.body && req.body.query && req.body.parameter) {
    var qs = '?searchview=true';
    // add search query
    qs += '&query=' + req.body.query;
    // add search query parameter
    qs += '&parameter=' + req.body.parameter;
    // redirect to the admin route, where the actual search and display is carried out
    res.redirect('/admin' + qs);
  } else {
    res.redirect('/admin');
  }
});

module.exports = router;