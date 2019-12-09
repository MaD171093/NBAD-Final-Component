var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userConnectionSchema = new Schema({
  userID: String,
  connectionID: String,
  rsvp: String
});

// var userConnection = function(uid, conn, rsvp){
// var userConnectionModel = {userID:uid,connection:conn, rsvp:rsvp};
// return userConnectionModel;
// };

//third argument in model is to specify mongoose to look for 'userConnections' collection. Otherwise it will look for 'userconnections'
module.exports = mongoose.model('userConnection', userConnectionSchema, 'userConnections');
