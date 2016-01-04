var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Level = require('../models/level');
var crypto = require('crypto');
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

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.user) {
    if (req.user.username == 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/users/' + req.user.username);
    }
  } else {
    res.redirect('/login');
  }
});

router.get('/register', function(req, res) {
  res.render('register', {});
});

router.post('/register', function(req, res) {
  if (req.body && req.body.firstname && req.body.lastname && req.body.school && req.body.email) {
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
          message: err.message
        });
      }

      passport.authenticate('local')(req, res, function() {
        // on login, redirect to profile page
        if (req.user.username == 'admin') {
          res.redirect('/admin');
        } else {
          res.redirect('/users/' + req.user.username);
        }
      });
    });
  } else {
    res.render('register', {
      message: 'All fields must be completed!'
    });
  }
});

router.get('/login', function(req, res) {
  if (req.user) {
    if (req.user.username == 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/users/' + req.user.username);
    }
  } else {
    if (req.query.failure === 'true') {
      // login page after incorrect attempt
      res.render('login', {
        message: 'Incorrect username or password.'
      });
    } else {
      // normal login page
      res.render('login');
    }
  }
});

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/login?failure=true'
}), function(req, res) {
  if (req.user.username == 'admin') {
    res.redirect('/admin');
  } else {
    // on login, redirect to profile page
    res.redirect('/users/' + req.user.username);
  }
});

router.get('/play', requireLogin, function(req, res) {
  var current_level = req.user.current_level;
  if (current_level == '-1') {
    res.render('play', {
      level: {},
      dq: true
    });
  } else {
    Level.findOne({
      level: current_level
    }, function(err, level) {
      if (err) {
        console.log(err);
        next(err); // TODO: handle better
      } else {
        level ? delete level.hashed_answer : console.log('no level found'); // self explanatory lol
        res.render('play', {
          level: level || {},
          info: req.session.info
        });
      }
    });
  }
});

router.get('/admin', requireAdminLogin, function(req, res) {
  Level.aggregate([{
    '$sort': {
      'level': 1,
    }
  }], function(err, levels) {
    if (err) {
      console.log(err);
      next(err);
    } else {
      if (req.query.editview) {
        var editview_id = String(req.query.editview);
        var details = null;
        for (var i = 0; i < levels.length; i++) {
          if (levels[i]._id == editview_id) {
            details = levels[i];
            break;
          }
        }
        res.render('admin', {
          levels: levels,
          editview: details
        });
      } else if (req.query.searchview) {
        var searchQuery = new RegExp(req.query.query, 'i');
        var searchField = req.query.parameter;
        var searchParams = {};
        searchParams[searchField] = {
          $regex: searchQuery
        }
        Account.find(searchParams, function(searcherr, data) {
          if (searcherr) {
            console.log(searcherr);
            next(searcherr);
          } else {
            res.render('admin', {
              levels: levels,
              searchview: data
            });
          }
        });
      } else {
        res.render('admin', {
          levels: levels
        });
      }
    }
  });
});

router.get('/leaderboard', function(req, res) {
  Account.aggregate([{
    '$sort': {
      'current_level': -1,
      'last_solved_timestamp': 1
    }
  }, {
    '$limit': 50
  }], function(err, data) {
    if (err) {
      next(err);
    } else {
      var signed_in = false;
      if (req.user) {
        signed_in = true;
      }
      var index;
      for (var i = 0 ; i < data.length; i++) {
        if (data[i].username == 'admin') {
          index = i;
          break;
        }
      }
      index ? delete data[index] : (console.log());
      res.render('leaderboard', {
        data: data,
        signed_in: signed_in
      });
    }
  });
});

/**
 * Logs out the user
 */
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/login');
});

module.exports = router;