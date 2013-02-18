/**
 * Author: Russell Toris
 * Version: February 1, 2013
 */

var WorldModel = function(options) {
  var worldModel = this;
  options = options || {};
  worldModel.ros = options.ros;
  worldModel.clientIP = options.clientIP;
  worldModel.user = options.user || 'anonymous';

  // get the client's IP address if it was not given
  if (!worldModel.clientIP) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        var json = JSON.parse(request.responseText);
        worldModel.clientIP = json.ip;
      }
    };
    request.open('GET', 'http://jsonip.com/', true);
    request.send();
  }

  // actionlib is used to communicate with the world_model
  var cwoi = new ActionClient({
    ros : worldModel.ros,
    serverName : '/world_model/create_world_object_instance',
    actionName : 'worldlib/CreateWorldObjectInstanceAction'
  });
  var uwoi = new ActionClient({
    ros : worldModel.ros,
    serverName : '/world_model/update_world_object_instance',
    actionName : 'worldlib/UpdateWorldObjectInstanceAction'
  });
  var woits = new ActionClient({
    ros : worldModel.ros,
    serverName : '/world_model/world_object_instance_tag_search',
    actionName : 'worldlib/WorldObjectInstanceTagSearchAction'
  });
  var cwod = new ActionClient({
    ros : worldModel.ros,
    serverName : '/world_model/create_world_object_description',
    actionName : 'worldlib/CreateWorldObjectDescriptionAction'
  });
  var gwod = new ActionClient({
    ros : worldModel.ros,
    serverName : '/world_model/get_world_object_description',
    actionName : 'worldlib/GetWorldObjectDescriptionAction'
  });

  // insert a new instance into the world model
  worldModel.createWorldObjectInstance = function(instance, callback) {
    // create the insertion goal
    var goal = new cwoi.Goal({
      instance : instance
    });
    // define the callback
    goal.on('result', function(result) {
      callback(result.instance_id);
    });
    // send the insertion
    goal.send();
  };

  // search for all instances with the given array of tags
  worldModel.worldObjectInstanceTagSearch = function(tags, callback) {
    // create the search goal
    var goal = new woits.Goal({
      tags : tags
    });
    // define the callback
    goal.on('result', function(result) {
      callback(result.instances);
    });
    // send the search
    goal.send();
  };

  // get the WorldObjectDescription associated with the given ID
  worldModel.getWorldObjectDescription = function(descriptionId, callback) {
    // create the search goal
    var goal = new gwod.Goal({
      description_id : descriptionId
    });
    // define the callback
    goal.on('result', function(result) {
      callback(result.description);
    });
    // send the search
    goal.send();
  };
  
  //insert a new description into the world model
  worldModel.createWorldObjectDescription = function(description, callback) {
    // create the insertion goal
    var goal = new cwod.Goal({
      description : description
    });
    // define the callback
    goal.on('result', function(result) {
      callback(result.description_id);
    });
    // send the insertion
    goal.send();
  };
};
