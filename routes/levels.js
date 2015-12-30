var express = require('express');
var passport = require('passport');
var Level = require('../models/level');
var Account = require('../models/level');
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
    res.redirect('/login');
  }
}

router.post('/new', requireAdminLogin, function(req, res) {
  var newLevel = new Level();
  newLevel.title = req.body.title;
  newLevel.hashed_answer = crypto.createHash('md5').update(req.body.answer).digest('hex');
  newLevel.level = req.body.level;
  newLevel.save(function(err, done) {
    if (err) {
      res.send(err);
    } else {
      res.redirect('/admin');
    }
  });
});

router.post('/:level', requireLogin, function(req, res) {
  var levelId = req.params.level;
  if (req.body.answer && req.body.answer != '') {
    Level.findOne({
      level: levelId
    }, function(err, levelDetails) {
      if (err) {
        console.log(err);
        res.send({
          result: 'Database error. Please try again in some time.'
        });
      } else {
        var encrypted_answer = crypto.createHash('md5').update(req.body.answer).digest('hex');
        if (encrypted_answer === levelDetails.hashed_answer) {
          // update user level and render new level
          var last_solved = (new Date()).getTime();
          Account.update(req.user, {
            current_level: req.user.current_level + 1,
            last_solved_timestamp: last_solved
          }, function(err, updatedResponse) {
            if (err) {
              console.log(err);
              res.send({
                result: 'Database error. Please try again in some time.'
              });
            } else {
              // reload play page
              res.redirect('/play');
            }
          });
        } else {
          res.send({
            result: 'Incorrect answer'
          });
        }
      }
    });
  } else {
    res.send({
      result: 'Invalid request.'
    });
  }
});

module.exports = router;