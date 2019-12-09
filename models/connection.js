var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var connectionSchema = new Schema({
  connectionID: String,
  connectionName: String,
  connectionTopic: String,
  details: String,
  dateTime: [],
  location: String,
  userID: String
});

// var connection = function(cid, cn, ct, d, dt, loc){
// var connectionModel = {connectionID:cid, connectionName:cn, connectionTopic:ct, details:d, dateTime:dt, location:loc};
// return connectionModel;
// };

module.exports = mongoose.model('connection', connectionSchema);
