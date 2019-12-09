var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  userID: String,
  firstName: String,
  lastName: String,
  emailAddress: String,
  address1Field: String,
  address2Field: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  username: String,
  password: String,
  salt: String
});

// var user = function(uid, fn, ln, em, add1, add2, city, state, zip, country){
// var userModel = {
//   userID:uid,
//   firstName:fn,
//   lastName:ln,
//   emailAddress:em,
//   address1Field:add1,
//   address2Field:add2,
//   City:city,
//   state:state,
//   zipCode:zip,
//   country:country};
// return userModel;
// };

module.exports = mongoose.model('user', userSchema);
