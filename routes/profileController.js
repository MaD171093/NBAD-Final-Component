var express = require('express');
var profileController = express.Router();
var bodyParser = require('body-parser');

var connectionDB = require('../utility/connectionDB.js');
var userDB = require('../utility/userDB.js');
var userConnectionDB = require('../utility/userConnectionDB.js');
var UserProfileModel = require('../models/userProfile.js');
var userConnection = require('../models/userConnection.js');

var saltHash =require('../utility/saltHash.js');

const { check, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');

var reqID;
var rsvp;
var userCoded;
var userProfile// keeps a track of user interaction during an active session
var user;//for displaying header according to the session
var userConnectionList;// stores userConnection objects
var reqIdList;//keeps a track of connectionIDs requested
var view;// for displaying header according to the session
var removeConnectionID ;

var urlencodedParser = bodyParser.urlencoded({ extended: false });


//for displaying login screen
profileController.get('/login',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  var msg = '';
  res.render('login',{view:view, user:user, msg:msg});
});


//for handling login requests
profileController.post('/savedConnections', urlencodedParser, [
  // username must be an email
  check('username','*Username must be email').trim().isEmail().normalizeEmail(),
  // password must be at least 5 chars long
  check('password').trim().isLength({ min: 5 }).withMessage('*Your password is atleast 5 characters long')
], function(req,res){
  var errors = validationResult(req);

  if (req.session.theUser) {
    res.redirect('savedConnections');
  }
  else{

    var uname = req.body.username;
    var pass = req.body.password;
    var boolUser = false;
    var userIndex;


    // userDB.findByEmail(uname)
    //   .then(function(user){
    //     var saltUser = user.salt;
    //     if(saltHash.sha512(pass, saltUser).passwordHash === user.password){
    //       boolUser = true;
    //       userIndex = user.userID;
    //     }
    //     else{
    //       boolUser = null;
    //     }
    //   });

      userDB.findByEmail(uname)
      .then(function(user){
        console.log("user",user);
        var saltUser = user[0].salt;
        if(saltHash.sha512(pass, saltUser).passwordHash === user[0].password){
          boolUser = true;
          userIndex = user[0].userID;
        }
        else{
          boolUser = null;
          }
      if(boolUser){
        // console.log("Success!!! logged in!!");
        view = "user";

        userConnectionList = []; // stores user's connection objects
        reqIdList = [];//keeps a track of connectionIDs requested

        //data of user from users collection
        userDB.getUser(userIndex)
        .then(function(userInfo){
          req.session.theUser = userInfo[0];
          user = req.session.theUser;
        })
        .catch(function(err){
          console.error("err", err);
        });

        userConnectionDB.getUserProfile(userIndex)
        .then(function(userCoded){
          userCoded.forEach(function(data){
            reqIdList.push(data.connectionID);
          });
        })
        .catch(function(err){
          console.error("err", err);
        });


        userConnectionDB.getUserConnections(userIndex)
        .then(function(data){
          // console.log("getUserConnections",data);
          data.forEach(function(d){
             userConnectionList.push({connection: d[0], rsvp: d[1]});
          });

          userProfile = new UserProfileModel(req.session.theUser.userID, userConnectionList);
          req.session.userConnection = userProfile.getConnections();

          // var userConnectionData = req.session.userConnection;
          // console.log("req.session.userConnection-2!!",req.session.userConnection);
          // console.log("userConnectionData",userConnectionData);

          res.render('savedConnections',{user:user, userConnectionData:req.session.userConnection, view:view});
        })
        .catch(function(err){
          console.error("err", err);
        });


      }
      else if (boolUser === null) {
        view = "general";
        if(!errors.isEmpty() && errors.mapped().password !== undefined){
          var msg = errors.mapped().password.msg;
        }
        else{
          var msg = '*Incorrect password, Try Again!';
        }
        res.render('login',{view:view, user:user, msg:msg});
      }
      else{
        view = "general";
        if(!errors.isEmpty() && errors.mapped().username !== undefined){
          var msg = errors.mapped().username.msg;
        }
        else{
          var msg = '*Username not registered, Try Again!';
        }
        res.render('login',{view:view, user:user, msg:msg});
      }
    }).catch(function(err){
      console.error("err", err);
    });
  }
});

// this is activated when user clicks on login button
profileController.get('/savedConnections', function(req,res){
  view = "user";
  reqID = req.query.connectionID;
  rsvp =  req.query.rsvp;
  deleteConnectionID = req.query.deleteConnectionID;
  if(req.session.theUser){

    if(reqID != null){//this is used to solve issues with requests anytime the session is active but there is no query string!

      //Data from user interaction
       connectionDB.getConnection(reqID)
      .then(function(connectionObject){
        if (reqIdList.includes(reqID) === false){
          reqIdList.push(reqID);
          userProfile.addConnection(connectionObject[0], rsvp)
          req.session.userConnection = userProfile.getConnections();
          res.render('savedConnections',{user:req.session.theUser, userConnectionData:req.session.userConnection, view:view});

        }
        else{
          userProfile.updateConnection(connectionObject[0], rsvp)
          .then(function(){
            req.session.userConnection = userProfile.getConnections();
            res.render('savedConnections',{user:req.session.theUser, userConnectionData:req.session.userConnection, view:view});
          });

        }
      })
      .catch(function(err){
        console.error("err", err);
      });

    }
    else{
      req.session.userConnection = userProfile.getConnections();
      res.render('savedConnections',{user:req.session.theUser, userConnectionData:req.session.userConnection, view:view});
    }

    if(deleteConnectionID != null){
      var indexReqId = reqIdList.indexOf(deleteConnectionID);
      reqIdList.splice(indexReqId,1);
      userProfile.removeConnection(deleteConnectionID);
      req.session.userConnection = userProfile.getConnections();
      res.render('savedConnections',{user:req.session.theUser, userConnectionData:req.session.userConnection, view:view});
    }

    // req.session.userConnection = userProfile.getConnections();
    // res.render('savedConnections',{user:req.session.theUser, userConnectionData:req.session.userConnection, view:view});

  }
  else{
    // to prevent direct access to saved connections by typing url.
    res.redirect('/login');
  }

});


//this is for log out
profileController.get('/savedConnections/clearSession', function(req,res){
  req.session.destroy(function(err) {
    if (err) {
      console.log("error deleting session");
    }
    userConnectionDB.userConnectionList = [];
    userProfile.emptyProfile();
    userProfile ='';
  });
  res.redirect('../index');
});


profileController.get('/signup',function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}
  res.render('signUp',{view:view, user:user, err:""});
});

profileController.post('/signup', urlencodedParser, [
  // firstName & lastname  must be at least 2 chars long- its a requied field.
  check('firstName').not().isEmpty().withMessage('First Name must be specified').trim().isLength({ min: 2 }).withMessage('Must be at least 2 chars long'),
  check('lastName').not().isEmpty().withMessage('Last Name must be specified').trim().isLength({ min: 2 }).withMessage('Must be at least 2 chars long'),
  // address1Field & address2Field  must be at least 6 and 2 chars long respectively - its a requied field.
  check('address1Field').not().isEmpty().withMessage('Address1 Field must be specified').trim().isLength({ min: 6 }).withMessage('Must be at least 6 chars long'),
  check('address2Field').not().isEmpty().withMessage('Address2 Field must be specified').trim().isLength({ min: 2 }).withMessage('Must be at least 2 chars long'),
  // city, state & country  must be at least 2 chars long and all String- its a requied field.
  check('city').not().isEmpty().withMessage('City Name must be specified')
  .custom((val ,{req}) => {
    // for checking if the input isAlpha() with white spaces
    if(isNaN(val)){
      return true;
    }
    else{
      throw new Error('City name Must be alphabetical chars only');
    }
  }).trim().isLength({ min: 2 }).withMessage('Must be at least 2 chars long'),
  check('state').not().isEmpty().withMessage('State Name must be specified')
  .custom((val ,{req}) => {
    // for checking if the input isAlpha() with white spaces
    if(isNaN(val)){
      return true;
    }
    else{
      throw new Error('State name Must be alphabetical chars only');
    }
  }).trim().isLength({ min: 2 }).withMessage('Must be at least 2 chars long'),
  check('country').not().isEmpty().withMessage('Country Name must be specified')
  .custom((val ,{req}) => {
    // for checking if the input isAlpha() with white spaces
    if(isNaN(val)){
      return true;
    }
    else{
      throw new Error('Country name Must be alphabetical chars only');
    }
  }).trim().isLength({ min: 2 }).withMessage('Must be at least 2 chars long'),
  //zipcode  must be a number- its a requied field.
  check('zipCode').not().isEmpty().withMessage('ZipCode Name must be specified').isNumeric().withMessage('Must be a number'),
  // email must be an email
  check('email').trim().isEmail().normalizeEmail().withMessage('Must be email')
  .custom(value => {
    return userDB.findByEmail(value).then(user => {
      if (user.length > 0) {
        return Promise.reject('E-mail already in use');
      }
    });
  }),
  // password must be at least 5 chars long and contain atleast on number
  check('password').trim().isLength({ min: 6 }).withMessage('Your password is atleast 5 characters long').custom((val ,{req}) => {
    // for checking if the input isAlpha() with white spaces
    // var num = parseInt(val);
    var num  = /\d/.test(val);
    if(!num){
      throw new Error('Password must contain atleast one number');
    }
    else{
      return true;
    }
  }),
],function(req,res){
  if (req.session.theUser){view ="user"; user = req.session.theUser;}
  else{view = "general";}

  var errors = validationResult(req);

  if(!errors.isEmpty()){
    res.render('signup',{view:view, user:user, err:errors.mapped()});
  }
  else{
    var uid = uidCreate();
    var salt = saltHash.genRandomString(16); /** Gives us salt of length 16 */
    var passwordData = saltHash.sha512(req.body.password, salt);
    console.log("passwordData",passwordData);

    var newUserObject = {
      userID: uid,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      emailAddress:req.body.email,
      address1Field:req.body.address1Field,
      address2Field:req.body.address2Field,
      city:req.body.city,
      state:req.body.state,
      zipCode:req.body.zipCode,
      country:req.body.country,
      username:req.body.email,
      password:passwordData.passwordHash,
      salt:passwordData.salt,
    }
    // console.log("newUserObject",newUserObject);
    userDB.addUser(newUserObject)
    .then(function(){
      res.redirect('/login');
    })


  }

});


profileController.all('/createdConnections', urlencodedParser,function(req,res){
  if (req.session.theUser){
    view ="user";
    user = req.session.theUser;
    removeConnectionID = req.query.removeConnectionID;

    if(removeConnectionID === undefined){
      userConnectionDB.getUserCreatedConnections(user.userID)
      .then(function(conns){
        // console.log('getUserCreatedConnections',conns);
        res.render('createdConnections',{user:user, userConnectionData:conns, view:view});
      });

    }
    else{
      var indexReqId = reqIdList.indexOf(removeConnectionID);
      reqIdList.splice(indexReqId,1);

      userProfile.removeConnectionFromProfile(removeConnectionID);

      connectionDB.removeConnection(removeConnectionID);
      userConnectionDB.removeConnection(removeConnectionID);


      userConnectionDB.getUserCreatedConnections(user.userID)
      .then(function(conns){
        // console.log('getUserCreatedConnections',conns);
        res.render('createdConnections',{user:user, userConnectionData:conns, view:view});
      });
      // req.session.userConnection = userProfile.getConnections();
      // res.render('savedConnections',{user:req.session.theUser, userConnectionData:req.session.userConnection, view:view});
    }


  }
  else{
    view = "general";
    res.redirect('/login');
  }
});


//used to create custom user ID
function uidCreate(){
  var num = Math.floor(Math.random() * 1000000000) + 1; // returns a random integer from 1 to 1000000000
  var code = "u"+String(num);
  return code;
}
module.exports = profileController;
