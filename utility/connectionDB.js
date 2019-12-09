var connection = require('../models/connection.js');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ArchitectureSociety', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

var connectionList = [];
var topicArray= [];
var topicsList= [];

// var data = [{
//   cid: '01_flw_club',
//   cn: 'Organic Architecture Model Shop',
//   ct: 'FRANK LLOYD WRIGHT CLUB',
//   d: 'Worshop for using lasercutter and 3D printer for creating 1:100 scaled models of selected modernist projects.',
//   dt: ['Friday; 20th October 2019','10:00 am - 02:00 pm'],
//   loc: 'Fabrication lab'
// },{
//   cid: '01_am_club',
//   cn: 'Integrative Technology Lab',
//   ct: 'ACHIM MENGES CLUB',
//   d: 'Worshop for troubleshooting kuka robot. And generating kuka code followed by building a basic brick wall.',
//   dt: ['Friday; 20th October 2019','10:00 am - 02:00 pm'],
//   loc: 'Robot Fabrication lab'
// },{
//   cid: '02_flw_club',
//   cn: 'Ludwig Van Beethoven Music Band',
//   ct: 'FRANK LLOYD WRIGHT CLUB',
//   d: 'Music band rehearsal followed by a 30 min performance, collection of songs from Ludwig Van playlist of Beethoven.',
//   dt: ['Friday; 20th October 2019','03:00 pm - 05:00 pm'],
//   loc: 'Storrs Amphitheater'
// },{
//   cid: '02_am_club',
//   cn: 'Biomemictics in Architecture',
//   ct: 'ACHIM MENGES CLUB',
//   d: 'Seminar and litrature review on application of biomemictics in architecture. Followed by fabrication session.',
//   dt: ['Friday; 20th October 2019','03:00 pm - 05:00 pm'],
//   loc: 'Student Union, Lounge'
// },{
//   cid: '03_am_club',
//   cn: 'Material logic Debates',
//   ct: 'ACHIM MENGES CLUB',
//   d: 'Extempore debates on various art and architecture material logic topic followed by lunch and discussion.',
//   dt: ['Thursday; 19th October 2019','10:00 am - 12:00 pm'],
//   loc: 'Student Union, Auditorium'
// },{
//   cid: '03_flw_club',
//   cn: 'Modernism Debates',
//   ct: 'FRANK LLOYD WRIGHT CLUB',
//   d: 'Extempore debates on various art and architecture modernism topic followed by lunch and discussion.',
//   dt: ['Thursday; 19th October 2019','10:00 am - 12:00 pm'],
//   loc: 'Student Union, Lounge'
// }];


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log('Connected to the database from connectionDB!');
});


//for sorting the connection objects based on topic alphabetically
function compareTopic(connectionA, connectionB){
  var x = connectionA.connectionTopic.toLowerCase();
  var y = connectionB.connectionTopic.toLowerCase();
  if (x < y) {return -1;}
  if (x > y) {return 1;}
  return 0;
}


//for creating a list of topics/categories
async function createTopicArray(){
  await connection.find(function (err, connections) {
    if (err) return console.error(err);
    connections.forEach(function(item){
      topicArray.push(item.connectionTopic);
    });

  });
};


//for getting a unique list of topics/categories for sorting it on the connections view
var getTopicList =  async function(){
  topicsList = [];
  topicArray =[];
  await createTopicArray();
  var uniqueSet = new Set(topicArray);
  var topicsList = Array.from(new Set(uniqueSet));
  return topicsList;
}

//for getting a list of all connections arranged alphabetically according to topic
var getConnections =  async function() {
  connectionList = await connection.find({});
  return connectionList;
}

//for getting a specific connection object with a particular connection ID
var getConnection = async function(connectionID){
  connectionDetailsList = await connection.find({ connectionID: connectionID });
  return connectionDetailsList;
}

// used for validating the query string in the url:(this function is called in connectionController)
// it checks if the connection ID is of valid format by: spltting the string on '_',
// checks if ID has 3 components, last component is club, first componet is number greater than 0
// if the format is right code checks if the id is present or not in the database
var validate = function(txt){
  var idList = txt.split("_");
  var result = false;
  if (idList.length === 3 && idList[2]==="club" && Number(idList[0])!= "NaN" && Number(idList[0])>0){
    result = true;
    return result;
  }
}
// var validate = function(txt){
//   console.log("inside validate");
//   var idList = txt.split("_");
//   var result = false;
//   if (idList.length === 3 && idList[2]==="club" && Number(idList[0])!= "NaN" && Number(idList[0])>0){
//     getConnections()
//     .then(function(data){
//       data.forEach(function(item){
//         if (txt === item.connectionID){result = true;}
//       })
//       console.log("result",result);
//       return result;
//     });
//   }
// }

// for adding the object to database as weel as updating connectionList and TopicArray
var addConnection = async function(obj){
  await connection.findOneAndUpdate(
    {connectionID: obj.connectionID, userID: obj.userID, connectionName: obj.connectionName, connectionTopic: obj.connectionTopic},
    { details: obj.details, dateTime: obj.dateTime, location: obj.location},
    {upsert: true, new:true},function (err) {
    if (err) return console.error(err);
    });
  var bool = false;
  connectionList.forEach(function(data){
    if(data.connectionName === obj.connectionName && data.connectionTopic === obj.connectionTopic){
      data.details = obj.details;
      data.dateTime = obj.dateTime;
      data.location = obj.location;
      bool = true;
    }
  });
  if ( bool === false){
    connectionList.push(obj);
    topicArray.push(obj.connectionTopic);
  }
  return connectionList;
}

//for deleting connctions
var removeConnection = async function(connectionID){
  await connection.deleteMany({ connectionID: connectionID}, function (err) {
    if (err) return console.error(err);
  });
}


module.exports.getTopicList = getTopicList;
module.exports.validate = validate;
module.exports.getConnections = getConnections;
module.exports.getConnection = getConnection;
module.exports.addConnection = addConnection;
module.exports.removeConnection = removeConnection;
