var express = require('express');
var router = express.Router();
var view;// for displaying header according to the session
var user;//for displaying header according to the session

router.get('/about',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  res.render('about',{view:view, user:user});
});

router.get('/contact',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  res.render('contact',{view:view, user:user});
});

router.get('/index',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  res.render('index',{view:view, user:user});
});

router.get('/',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  res.render('index',{view:view, user:user});
});


router.get('/*' ,function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  res.render('404',{view:view, user:user});
});


module.exports = router;
