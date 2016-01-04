var express = require('express');
var passport = require('passport');
var Level = require('../models/level');
var Account = require('../models/account');
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

/**
 * Adds a new level to the database, only if created by an admin account.
 * Must contain at the least the following the fields:
 * req.body: {
 *   title: String,
 *   answer: String,
 *   level: Number,
 *   clue1: String
 * }
 */
router.post('/new', requireAdminLogin, function(req, res) {
  if (req.body && req.body.title && req.body.level && req.body.clue1 && req.body.answer) {
    var newLevel = new Level();
    newLevel.title = req.body.title;
    newLevel.hashed_answer = crypto.createHash('md5').update(req.body.answer).digest('hex');
    newLevel.level = Number(req.body.level);
    newLevel.clue1 = req.body.clue1;
    newLevel.comment_clue = (req.body.comment_clue ? req.body.comment_clue : null);
    newLevel.save(function(err, done) {
      if (err) {
        res.send(err);
      } else {
        res.redirect('/admin');
      }
    });
  } else {
    console.log('ERROR: Attempt to create new level failed.')
    res.redirect('/admin');
  }
});

/**
 * Checks answer for a level for a logged in user.
 * If answer is incorrect, the play page is reloaded.
 * If answer is correct, the user's current level is incremented, and the play page is reloaded with the new level.
 */
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
          Account.findOne({
            username: req.user.username
          }, function(err, account) {
            if (err) {
              console.log(err);
              res.send({
                result: 'Database error. Please try again in some time.'
              });
            } else {
              account.current_level = String(Number(account.current_level) + 1);
              account.last_solved_timestamp = last_solved;
              account.save(function(err, saveResponse) {
                // reload play page
                req.session.info = null;
                res.redirect('/play');
              })
            }
          });
        } else {
          delete levelDetails.hashed_answer;
          req.session.info = 'Incorrect answer';
          res.redirect('/play');
        }
      }
    });
  } else {
    res.send({
      result: 'Invalid request.'
    });
  }
});

/**
 * Deletes a level, but requires admin privilege.
 */
router.get('/:level/delete', requireAdminLogin, function(req, res) {
  var level_id_to_delete = req.params.level;
  Level.remove({
    _id: level_id_to_delete
  }, function(err, result) {
    if (err) {
      console.log(err);
      next(err); // TODO: handle better
    } else {
      res.redirect('/admin');
    }
  });
});

/**
 * Preloads admin view with data for editing/view a particular level.
 */
router.get('/:level/edit', requireAdminLogin, function(req, res) {
  res.redirect('/admin?editview=' + req.params.level);
});

/**
 * Edits a level's details through the admin page form, with admin priveleges
 */
router.post('/:level/edit', requireAdminLogin, function(req, res) {
  if (req.body) {
    Level.findOne({
      _id: req.params.level
    }, function(err, level) {
      if (err) {

      } else {
        level.title = (req.body.title ? req.body.title : level.title);
        level.hashed_answer = (req.body.answer ? crypto.createHash('md5').update(req.body.answer).digest('hex') : level.hashed_answer);
        level.level = Number(req.body.level ? req.body.level : level.level);
        level.clue1 = (req.body.clue1 ? req.body.clue1 : level.clue1);
        level.comment_clue = (req.body.comment_clue ? req.body.comment_clue : level.comment_clue);
        level.save(function(err, done) {
          if (err) {
            res.send(err);
          } else {
            res.redirect('/admin?editview=' + req.params.level);
          }
        });
      }
    });
  } else {
    res.redirect('/admin?editview=' + req.params.level);
  }
});

module.exports = router;