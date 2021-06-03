var express = require('express');
var router = express.Router();
// var indexView = require('../views/index');

/* GET home page. */
router.get('/', function(req, res) {
  res.redirect('/catalog');
  // res.send(indexView);
});

module.exports = router;
