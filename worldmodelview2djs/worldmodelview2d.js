/**
 * Author: Russell Toris Version: February 14, 2013
 */

var WorldModelView2D = function(options) {
  var view2D = this;
  options = options || {};
  view2D.worldModel = options.worldModel;
  view2D.div = options.div;

  // the main div where everything will be added
  var divHandle = document.getElementById(view2D.div);

  // create the main canvas in the div
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');

  // the main map data to draw
  var map = {
    // metadata
    info : null,
    // the OccupancyGrid rendered into a canvas
    canvas : null
  };

  // an array to hold all robot object instances
  var robots = [];
  // icon information
  var maxRobotRadius = 6;
  var minRobotRadius = 3;
  var robotRadius = minRobotRadius;
  var robotRadiusGrow = true;
  var growThrottle = 2;
  var growCounter = 0;

  // an array to hold all poi and polygon object instances
  var poi = [];
  var polygon = [];

  // external draw callback functions
  var callbacks = [];

  // sets the canvas to display a loading message
  var initCanvas = function() {
    canvas.width = '720';
    canvas.height = '720';
    canvas.style.background = '#333333';
    // set the text
    context.lineWidth = 4;
    context.fillStyle = '#ffffff';
    context.font = '40px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    var text = 'Loading existing world model...';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    // no right click menu
    canvas.oncontextmenu = function() {
      return false;
    };
    // add it the to the div
    divHandle.appendChild(canvas);
  };

  // set the 'map' field based on the given OccupancyGrid
  var setMapFromMessage = function(message) {
    // create an internal canvas to draw it on
    var mCanvas = document.createElement('canvas');
    var mapContext = mCanvas.getContext('2d');

    // set the size
    mCanvas.width = message.info.width;
    mCanvas.height = message.info.height;

    // convert the message to a PNG image
    var imageData = mapContext.createImageData(mCanvas.width, mCanvas.height);
    for ( var row = 0; row < message.info.height; row++) {
      for ( var col = 0; col < message.info.width; col++) {
        // determine the index into the map data
        var mapI = col + ((mCanvas.height - row - 1) * mCanvas.width);
        // determine the value
        if (message.data[mapI] == 100) {
          var val = 0;
        } else if (message.data[mapI] == 0) {
          var val = 255;
        } else {
          var val = 127;
        }

        // determine the index into the image data array
        var i = (col + (row * imageData.width)) * 4;
        // r
        imageData.data[i] = val;
        // g
        imageData.data[++i] = val;
        // b
        imageData.data[++i] = val;
        // a
        imageData.data[++i] = 255;
      }
    }
    mapContext.putImageData(imageData, 0, 0);

    // store the map
    map.info = message.info;
    map.canvas = mCanvas;
  };

  var worldCoordToCanvasPixel = function(x, y) {
    // get the size of the map and the offset
    var dim = view2D.getScaledMapDimensions();
    var resolution = view2D.getScaledResolution();
    var offsetX = (canvas.width - dim.width) / 2;
    var offsetY = (canvas.height - dim.height) / 2;

    // find the offset relative to the canvas
    var addOffsetX = (x / resolution) + offsetX;
    // note that 0, 0 in our coordinate frame is at the bottom left
    var addOffsetY = canvas.height - offsetY - ((y / resolution));

    return {
      x : addOffsetX,
      y : addOffsetY
    };
  };

  // accessor for the canvas
  view2D.getCanvas = function() {
    return canvas;
  };

  // get the dimensions of the map in pixels based on the canvas size
  view2D.getScaledMapDimensions = function() {
    var canvasRatio = canvas.width / canvas.height;
    var curRatio = map.canvas.width / map.canvas.height;
    // maintain aspect ratio
    if (canvasRatio > curRatio) {
      return {
        width : canvas.height * curRatio,
        height : canvas.height
      };
    } else {
      return {
        width : canvas.width,
        height : canvas.width / curRatio
      };
    }
  };

  // get the scaled map resolution based on the canvas size
  view2D.getScaledResolution = function() {
    return map.info.resolution
        * (map.info.width / view2D.getScaledMapDimensions().width);
  };

  // allows you to add a callback function that is called on 'draw'
  view2D.addDrawCallback = function(callback) {
    callbacks.push(callback);
  };

  // draw a point on the canvas in world coordinates
  view2D.drawWorldPoint = function(x, y, theta, radius, color) {
    pixels = worldCoordToCanvasPixel(x, y);

    // add the marker
    context.save();
    context.fillStyle = color;
    // check if we have an orientation
    if (theta !== null) {
      context.lineWidth = 3;
      context.translate(pixels.x, pixels.y);
      context.rotate(-(theta + Math.PI / 2.0));
      context.moveTo(-radius, -radius);
      context.beginPath();
      context.lineTo(0, radius * 2);
      context.lineTo(radius, -radius);
      context.lineTo(-radius, -radius);
      context.closePath();
      context.stroke();
      context.globalAlpha = 0.7;
    } else {
      context.beginPath();
      context.arc(pixels.x, pixels.y, radius, 0, 2 * Math.PI, false);
    }
    context.fill();
    context.restore();
  };

  // draw a polygon on the canvas in world coordinates
  view2D.drawWorldPolygon = function(points, color) {
    context.fillStyle = color;
    context.globalAlpha = 0.5;
    context.lineWidth = 3;
    context.beginPath();
    // go through each point
    var numPoints = points.length;
    for ( var i = 0; i < numPoints; i++) {
      pixels = worldCoordToCanvasPixel(points[i].x, points[i].y);
      if (i === 0) {
        context.moveTo(pixels.x, pixels.y);
      } else {
        context.lineTo(pixels.x, pixels.y);
      }
    }
    context.closePath();
    context.fill();
    context.globalAlpha = 1;
    context.stroke();
  };

  // draw text on the canvas in world coordinates
  view2D.drawWorldText = function(x, y, text) {
    pixels = worldCoordToCanvasPixel(x, y);
    context.fillStyle = '#000000';
    context.font = 'bold 13px sans-serif';
    context.fillText(text, pixels.x, pixels.y);
  };

  // find the centroid of a polygon
  var centroid = function(points) {
    // close it
    if(points[0].x !== points[points.length-1].x && points[0].y !== points[points.length-1].y) {
      points.push({x:points[0].x, y:points[0].y});
    }
    
    var x = 0;
    var y = 0;
    var area = 0;
    for ( var i = 0; i < points.length - 1; i++) {
      x += (points[i].x + points[i + 1].x)
          * ((points[i].x * points[i + 1].y) - (points[i + 1].x * points[i].y));
      y += (points[i].y + points[i + 1].y)
          * ((points[i].x * points[i + 1].y) - (points[i + 1].x * points[i].y));
      area += ((points[i].x * points[i+1].y) - (points[i+1].x * points[i].y));
    }
    
    area /= 2;
    x /= (6*area);
    y /= (6*area);
    
    return {x : x, y : y};
  };

  // draw the world model onto the canvas
  var draw = function() {
    // only continue if we have the map
    if (map.info && map.canvas) {
      // clear out the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // draw the map first
      var dim = view2D.getScaledMapDimensions();
      var resolution = view2D.getScaledResolution();
      var mapWidth = dim.width;
      var mapHeight = dim.height;

      // draw it onto the internal map
      var offsetX = (canvas.width - mapWidth) / 2;
      var offsetY = (canvas.height - mapHeight) / 2;
      context.drawImage(map.canvas, offsetX, offsetY, mapWidth, mapHeight);

      // draw the polygons
      for ( var i = 0; i < polygon.length; i++) {
        var points = polygon[i].points;
        view2D.drawWorldPolygon(points, '#24AB8C');
        c = centroid(points);
        view2D.drawWorldText(c.x, c.y, polygon[i].name);
      }

      // draw the pois
      for ( var i = 0; i < poi.length; i++) {
        var poiX = poi[i].pose.pose.pose.position.x;
        var poiY = poi[i].pose.pose.pose.position.y;
        var q0 = poi[i].pose.pose.pose.orientation.w;
        var q1 = poi[i].pose.pose.pose.orientation.x;
        var q2 = poi[i].pose.pose.pose.orientation.y;
        var q3 = poi[i].pose.pose.pose.orientation.z;
        var theta = Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (Math
            .pow(q2, 2) + Math.pow(q3, 2)));
        view2D.drawWorldPoint(poiX, poiY, theta, 6, '#24E576');
        view2D.drawWorldText(poiX, poiY + 1, poi[i].name);
      }

      // draw the robots
      for ( var i = 0; i < robots.length; i++) {
        var robotX = robots[i].pose.pose.pose.position.x;
        var robotY = robots[i].pose.pose.pose.position.y;
        // angle
        var q0 = robots[i].pose.pose.pose.orientation.w;
        var q1 = robots[i].pose.pose.pose.orientation.x;
        var q2 = robots[i].pose.pose.pose.orientation.y;
        var q3 = robots[i].pose.pose.pose.orientation.z;
        var theta = Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (Math
            .pow(q2, 2) + Math.pow(q3, 2)));

        view2D.drawWorldPoint(robotX, robotY, theta, robotRadius, '#543210');
        view2D.drawWorldText(robotX, robotY + 1, robots[i].name);
      }
      // update the robot marker radius
      if (growCounter >= growThrottle) {
        if (robotRadiusGrow) {
          robotRadius++;
        } else {
          robotRadius--;
        }
        if (robotRadius === maxRobotRadius || robotRadius <= minRobotRadius) {
          robotRadiusGrow = !robotRadiusGrow;
        }
        growCounter = 0;
      } else {
        growCounter++;
      }

      // call the callbacks
      for ( var i = 0; i < callbacks.length; i++) {
        callbacks[i]();
      }
    }
  };

  // set an initial loading message
  initCanvas();

  // attempt to get the map
  document.body.style.cursor = 'wait';
  view2D.worldModel
      .worldObjectInstanceTagSearch(
          [ 'map' ],
          function(instances) {
            // check if we found at least one map
            if (instances.length === 0) {
              view2D.emit('error', 'No existing map found in the world model.');
            } else {
              // check if we only found one
              if (instances.length > 1) {
                view2D
                    .emit('warning',
                        'Multiple maps found in the world model. Defaulting to the first map.');
              }
              // get the description
              view2D.worldModel.getWorldObjectDescription(
                  instances[0].description_id, function(description) {
                    // search for the OccupancyGrid
                    for ( var i = 0; i < description.descriptors.length; i++) {
                      var d = description.descriptors[i];
                      if (d.type === 'nav_msgs/OccupancyGrid') {
                        // parse out the data and extract the data
                        var message = JSON.parse(d.data.replace(/'/g, '"'));
                        setMapFromMessage(message);
                        document.body.style.cursor = 'default';
                      }
                    }
                  });
            }
          });

  // get the world model every second
  setInterval(
      function() {
        // search for all 'robot' tags
        view2D.worldModel
            .worldObjectInstanceTagSearch(
                [ 'robot' ],
                function(instances) {
                  // search all the instances
                  for ( var i = 0; i < instances.length; i++) {
                    // check if we are updating or adding a new robot location
                    var found = false;
                    for ( var j = 0; j < robots.length; j++) {
                      if (robots[j].instance_id === instances[i].instance_id) {
                        // update the old one
                        found = true;
                        robots[j] = instances[i];
                        j = robots.length;
                      }
                    }
                    // add the new one
                    if (!found) {
                      robots.push(instances[i]);
                    }
                  }

                  // search for all 'poi' tags
                  view2D.worldModel
                      .worldObjectInstanceTagSearch(
                          [ 'poi' ],
                          function(instances) {
                            // search all the instances
                            for ( var i = 0; i < instances.length; i++) {
                              // check if we are updating or adding a new poi
                              // location
                              var found = false;
                              for ( var j = 0; j < poi.length; j++) {
                                if (poi[j].instance_id === instances[i].instance_id) {
                                  // update the old one
                                  found = true;
                                  poi[j] = instances[i];
                                  j = poi.length;
                                }
                              }
                              // add the new one
                              if (!found) {
                                poi.push(instances[i]);
                              }
                              // emit the new points
                              view2D.emit('poi', poi);
                            }
                          });

                  // search for all 'polygon' tags
                  view2D.worldModel
                      .worldObjectInstanceTagSearch(
                          [ 'polygon' ],
                          function(instances) {
                            // search all the instances
                            for ( var i = 0; i < instances.length; i++) {
                              // get the description
                              view2D.worldModel
                                  .getWorldObjectDescription(
                                      instances[i].description_id,
                                      function(description) {
                                        // search for the Polygon
                                        for ( var i = 0; i < description.descriptors.length; i++) {
                                          var d = description.descriptors[i];
                                          if (d.type === 'geometry_msgs/Polygon') {
                                            // check if we are updating or
                                            // adding a new polygon
                                            var found = false;
                                            for ( var j = 0; j < polygon.length; j++) {
                                              if (polygon[j].description_id === description.description_id) {
                                                // update the old one
                                                found = true;
                                                var data = JSON.parse(d.data
                                                    .replace(/'/g, '"'));
                                                data.description_id = description.description_id;
                                                data.name = description.name;
                                                polygon[j] = data;
                                                j = polygon.length;
                                              }
                                            }
                                            // add the new one
                                            if (!found) {
                                              var data = JSON.parse(d.data
                                                  .replace(/'/g, '"'));
                                              data.description_id = description.description_id;
                                              data.name = description.name;
                                              polygon.push(data);
                                            }
                                          }
                                        }
                                      });
                            }
                            // emit the new polygons
                            view2D.emit('polygon', polygon);
                          });
                });
      }, 500);

  // set the interval for the draw function
  setInterval(draw, 30);

  WorldModelView2D.prototype.__proto__ = EventEmitter2.prototype;
};