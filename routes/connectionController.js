var express = require('express');
var controller = express.Router();
var bodyParser = require('body-parser');
var reqID;
var connectionDB = require('../utility/connectionDB.js');
var userDB = require('../utility/userDB.js');
var view;// for displaying header according to the session
var user;//for displaying header according to the session
const { check, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

controller.get('/newConnection',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  res.render('newConnection',{view:view, detail:false, user:user, err:""});
});

//for handling new connections
controller.post('/newConnection',urlencodedParser,[
  // Club name must be at least 5 chars long and all String - its a requied field..
  check('topic').not().isEmpty().withMessage('Club name must be specified')
  .custom((val ,{req}) => {
    // for checking if the input isAlpha() with white spaces
    if(isNaN(val)){
      return true;
    }
    else{
      throw new Error('Club name Must be alphabetical chars only');
    }
  }).trim().isLength({ min: 5 }).withMessage('Must be at least 5 chars long'),
  // Event name must be at least 5 chars long and all String- its a requied field.
  check('name').not().isEmpty().withMessage('Event name must be specified').trim().isLength({ min: 5 }).withMessage('Must be at least 5 chars long'),
  //Details must be 3 chars long
  check('details').not().isEmpty().withMessage('Add TBD if details not available').trim().isLength({ min: 3, max:200 }).withMessage('Must be at least 3 chars long and less than 200'),
  //location must be 3 chars long
  check('location').not().isEmpty().withMessage('Add TBD if location not available').trim().isLength({ min: 3 }).withMessage('Must be at least 3 chars long'),
  //date must be after current date for new connections
  check('date').not().isEmpty().withMessage('Date must be specified').toDate().isAfter().withMessage('Event must be held after today, please change the date'),
  check('time').not().isEmpty().withMessage('Time must be specified')
],function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}

  var errors = validationResult(req);


  if(!errors.isEmpty()){
    res.render('newConnection',{view:view, user:user, err:errors.mapped()});
  }
  else{

  var topic = req.body.topic;
  var name = req.body.name;
  var details = req.body.details;
  var location = req.body.location;
  var date = req.body.date;
  var time = req.body.time;
  var duration =req.body.duration;


  //for formatting the date to look like 'Tuesday, December 3, 2019'
  date = new Date(date.getFullYear(),date.getMonth(),date.getUTCDate());
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  date = date.toLocaleDateString('en-US', options);


  //for formatting time to look like '10:00 - 12:00'
  var endTime = parseInt(time) + parseInt(duration);
  var timeSlot = String(time)+' - '+String(endTime)+':'+String(time).split(':')[1];



  var newConnectionObj= {
    connectionID: req.session.editConnectionId || idCreate(topic),
    connectionName: ucfirst(name),
    connectionTopic: topic.toUpperCase() + " " + "CLUB",
    details: details,
    dateTime: [date,timeSlot],
    location: location,
    userID:req.session.theUser.userID
  }
  // console.log("newConnectionObj!!!!!!",newConnectionObj);
  connectionDB.addConnection(newConnectionObj).then(function(data){
    // res.render('connections', {view:view, data: connectionDB.getConnections(), dataTopic: connectionDB.getTopicList(), user:user});
    res.redirect('connections');
  });

  }
});


controller.get('/connections',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  connectionDB.getConnections()
  .then(function(data){
    connectionDB.getTopicList()
    .then(function(dataTopic){
      res.render('connections', {view:view, data: data, dataTopic: dataTopic, user:user});
    });
  })
  .catch(function(err){
    console.error("err", err);
  });
});

//if the connectionID in the query string is vaild it displays the requested page.
//if no query string is passed i.e. if connectionID is undefined or when connectionID is invalid connections view is shown (list of all connections)
controller.get('/connection',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  reqID = req.query.connectionID;
  var result = connectionDB.validate(reqID);
  if (reqID === undefined) {
    console.log("query string is undefined");
    res.redirect('connections');
  }
  else if (result === true){
    // console.log("Valid!!!!");
    connectionDB.getConnection(reqID)
    .then(function(detail){
      var hostID = detail[0].userID;
      userDB.getUser(hostID)
      .then(function(userInfo){
        var name = userInfo[0].firstName +" "+userInfo[0].lastName;
        res.render('connection',{view:view, details:detail[0], host:name, reqID:reqID, user:user});
      })
    })
    .catch(function(err){
      console.error("err", err);
    });
  }
  else {
    console.log("query string is not valid");
    res.render('404',{view:view, user:user});
  }
});

// this is activated when user clicks on update button in savedConnections view
controller.post('/connection',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  res.render('connection',{view:view, details:connectionDB.getConnection(reqID)[0], user:user});
});


controller.get('/editConnection',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}

  var editConnectionId = req.query.connectionID;
  req.session.editConnectionId = editConnectionId;

  connectionDB.getConnection(editConnectionId)
  .then(function(data){
    res.render('newConnection',{view:view, detail:data[0], user:user, err:""});
  });
});

function ucfirst(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function idCreate(string){
  var num = Math.floor(Math.random() * 100) + 1; // returns a random integer from 1 to 100
  var code = String(num)+"_";
  var words = string.toLowerCase().split(' ');
  words.forEach(function(word){
    code = code + word.charAt(0);
  });
  code = code + "_club";
  return code
}

module.exports = controller;
