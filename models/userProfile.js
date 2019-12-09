var userConnectionDB = require('../utility/userConnectionDB.js');

class UserProfile{
  constructor(uid,uconn){
    this._userID = uid;
    this._userConnection = uconn;
  }

  addConnection(connection, rsvp){
    this._userConnection.push({connection: connection, rsvp: rsvp});
    userConnectionDB.addRSVP(this._userID, connection.connectionID, rsvp);
  }

  async updateConnection(connection, rsvp){
    this._userConnection.forEach(function(data){
      if(data.connection.connectionID === connection.connectionID){
        data.rsvp = rsvp
      }
    });
    await userConnectionDB.updateRSVP(this._userID, connection.connectionID, rsvp);
  }

  removeConnection(deleteConnectionID){
    var index = this._userConnection.indexOf(deleteConnectionID);
    this._userConnection.splice(index,1);
    userConnectionDB.deleteConnection(deleteConnectionID, this._userID)
  }

  removeConnectionFromProfile(removeConnectionID){
    var index;
    for(var i =0; i < this._userConnection.length; i++){
      if(this._userConnection[i].connection.connectionID === removeConnectionID){
        index = i;
      }
    }
    // var i = this._userConnection.indexOf(removeConnectionID);
    if(index !== undefined){
      this._userConnection.splice(index,1);
    }

  }

  getConnections(){
    return this._userConnection;
  }

  emptyProfile(){
    this._userConnection = [];
  }

}


module.exports = UserProfile;
