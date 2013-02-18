/**
 * Author: Russell Toris Version: February 14, 2013
 */

var Annotator2D = function(options) {
  var annotator2D = this;
  options = options || {};
  annotator2D.view = options.view;
  annotator2D.div = options.div;

  // the main div where everything will be added
  var divHandle = document.getElementById(annotator2D.div);

  // create pointers to some objects we will use
  var canvas = annotator2D.view.getCanvas();
  var context = canvas.getContext('2d');
  var worldModel = annotator2D.view.worldModel;

  var initAddWorldLocationForm = function() {
    // the "Add World Location" form
    var addWorldLocation = document.createElement('div');
    addWorldLocation.innerHTML = '<h2>Add World Location</h2>';
    addWorldLocation.innerHTML += '<span id="add-point-selector"><b>Add Point of Interest</b></span>';
    addWorldLocation.innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;';
    addWorldLocation.innerHTML += '<span id="add-polygon-selector"><b>Add Polygon</b></span>';
    addWorldLocation.innerHTML += '<br /><br />';

    // point of interest editor
    var addPoint = document.createElement('div');
    addPoint.id = 'add-poi-div';
    addPoint.style.display = 'block';
    addPoint.innerHTML = 'X: <span id="x-poi-display"></span>m';
    addPoint.innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;';
    addPoint.innerHTML += 'Y: <span id="y-poi-display"></span>m';
    addPoint.innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;';
    addPoint.innerHTML += 'Theta: <span id="theta-poi-display"></span>&deg;';
    addPoint.innerHTML += '<br /><br />';
    addPoint.innerHTML += 'Label: <input id="poi-label" type="text" />';
    addPoint.innerHTML += '<br /><br />';
    addPoint.innerHTML += '<button id="add-poi">Add</button>';
    addPoint.innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;';
    addPoint.innerHTML += '<button id="clear-poi">Clear</button>';
    addWorldLocation.appendChild(addPoint);

    // polygon editor
    var addPolygon = document.createElement('div');
    addPolygon.id = 'add-polygon-div';
    addPolygon.style.display = 'none';
    addPolygon.innerHTML += 'Number of Points: <span id="points-count">0</span>';
    addPolygon.innerHTML += '<br /><br />';
    addPolygon.innerHTML += 'Label: <input id="polygon-label" type="text" />';
    addPolygon.innerHTML += '<br /><br />';
    addPolygon.innerHTML += '<button id="add-polygon">Add</button>';
    addPolygon.innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;';
    addPolygon.innerHTML += '<button id="clear-polygon">Clear</button>';
    addWorldLocation.appendChild(addPolygon);

    divHandle.appendChild(addWorldLocation);
  };

  // setup the "Add World Location" form
  initAddWorldLocationForm();

  // add the "tabs"
  document.getElementById('add-point-selector').onmouseover = function() {
    this.style.cursor = 'pointer';
  };
  document.getElementById('add-point-selector').onclick = function() {
    // clear the polygon first
    document.getElementById('clear-polygon').onclick();
    document.getElementById('add-poi-div').style.display = 'block';
    document.getElementById('add-polygon-div').style.display = 'none';
  };
  document.getElementById('add-polygon-selector').onmouseover = function() {
    this.style.cursor = 'pointer';
  };
  document.getElementById('add-polygon-selector').onclick = function() {
    // clear the poi first
    document.getElementById('clear-poi').onclick();
    document.getElementById('add-poi-div').style.display = 'none';
    document.getElementById('add-polygon-div').style.display = 'block';
  };

  // the clear buttons
  document.getElementById('clear-poi').onclick = function() {
    document.getElementById('poi-label').value = '';
    document.getElementById('x-poi-display').innerHTML = '';
    document.getElementById('y-poi-display').innerHTML = '';
    document.getElementById('theta-poi-display').innerHTML = '';
  };
  document.getElementById('clear-polygon').onclick = function() {
    document.getElementById('points-count').innerHTML = '0';
    document.getElementById('polygon-label').value = '';
    polygonPoints = new Array();
  };

  // the add buttons
  document.getElementById('add-poi').onclick = function() {
    // check if we have a label
    var label = document.getElementById('poi-label').value;
    var x = document.getElementById('x-poi-display').innerHTML;
    var y = document.getElementById('y-poi-display').innerHTML;
    var theta = document.getElementById('theta-poi-display').innerHTML;
    if (label.length === 0) {
      alert('Error: Missing Point-of-Interest Label');
    } else if (x.length + y.length + theta.length < 3) {
      alert('Error: Missing Point-of-Interest');
    } else {
      // convert to quaternions
      var rads = parseFloat(theta) * (Math.PI / 180);
      var w = Math.cos(rads / 2);
      var z = Math.sin(rads / 2);
      // do the insertion
      worldModel.createWorldObjectInstance({
        name : document.getElementById('poi-label').value,
        pose : {
          pose : {
            pose : {
              position : {
                x : parseFloat(x),
                y : parseFloat(y),
                z : 0
              },
              orientation : {
                x : 0,
                y : 0,
                z : z,
                w : w
              }
            }
          }
        },
        tags : [ 'poi' ]
      }, function(id) {
      });
      // clear the poi adder
      document.getElementById('clear-poi').onclick();
    }
  };
  document.getElementById('add-polygon').onclick = function() {
    // check if we have a label
    var label = document.getElementById('polygon-label').value;
    if (label.length === 0) {
      alert('Error: Missing Polygon Label');
    } else if (polygonPoints.length < 3) {
      alert('Error: Not Enough Points');
    } else {
      // convert to x, y, z points
      var polygon = {
        points : []
      };
      var numPoints = polygonPoints.length;
      for ( var i = 0; i < numPoints; i++) {
        polygon.points[i] = {
          x : polygonPoints[i].x,
          y : polygonPoints[i].y,
          z : 0
        };
      }
      // create the ref JSON
      var ref = {
        type : 'annotation'
      };
      // create the description and then the instance
      worldModel.createWorldObjectDescription({
        name : document.getElementById('polygon-label').value,
        descriptors : [ {
          type : 'geometry_msgs/Polygon',
          data : JSON.stringify(polygon),
          ref : JSON.stringify(ref),
          tags : [ 'Polygon' ]
        } ],
        tags : [ 'polygon' ]
      }, function(id) {
        // create the instance
        worldModel.createWorldObjectInstance({
          name : document.getElementById('polygon-label').value,
          pose : {
            pose : {
              pose : {
                position : {
                  x : 0,
                  y : 0,
                  z : 0
                },
                orientation : {
                  x : 0,
                  y : 0,
                  z : 0,
                  w : 1
                }
              }
            }
          },
          description_id : id,
          tags : [ 'polygon' ]
        }, function(id) {
        });
      });

      // clear the polygon adder
      document.getElementById('clear-polygon').onclick();
    }
  };

  var getCanvasEventCoords = function(e) {
    // get the click location with (0, 0) at the top left
    var offsetLeft = 0;
    var offsetTop = 0;
    var element = canvas;
    while (element && !isNaN(element.offsetLeft) && !isNaN(element.offsetTop)) {
      offsetLeft += element.offsetLeft - element.scrollLeft;
      offsetTop += element.offsetTop - element.scrollTop;
      element = element.offsetParent;
    }

    return {
      x : e.pageX - offsetLeft,
      y : e.pageY - offsetTop
    };
  };

  // convert to world coordinates
  var canvasCoordsToWorldCoords = function(x, y) {
    var dim = annotator2D.view.getScaledMapDimensions();
    var res = annotator2D.view.getScaledResolution();
    var offsetX = (canvas.width - dim.width) / 2;
    var offsetY = (canvas.height - dim.height) / 2;
    var xPos = (x - offsetX) * res;
    var yPos = (dim.height - y + offsetY) * res;
    return {
      x : xPos,
      y : yPos
    };
  };

  // mouse interaction information
  var leftDown = false;
  var clickX;
  var clickY;
  var clickTheta;
  var polygonPoints = new Array();

  // display a corsshair for the cursor
  canvas.onmouseover = function(e) {
    this.style.cursor = 'crosshair';
  };

  // record where the click starts
  canvas.onmousedown = function(e) {
    // check which tab we are on
    if (document.getElementById('add-poi-div').style.display === 'block') {
      // check if this is a left click
      if (e.button === 0) {
        leftDown = true;
        // get the coordinates
        var coords = getCanvasEventCoords(e);
        clickX = coords.x;
        clickY = coords.y;

        // convert to world coordinates
        coords = canvasCoordsToWorldCoords(clickX, clickY);
        document.getElementById('x-poi-display').innerHTML = coords.x;
        document.getElementById('y-poi-display').innerHTML = coords.y;
        document.getElementById('theta-poi-display').innerHTML = 0.00;
      }
    } else {
      // check if this is a left click
      if (e.button === 0) {
        leftDown = true;
        // get the coordinates
        var coords = getCanvasEventCoords(e);
        // convert to world coordinates
        coords = canvasCoordsToWorldCoords(coords.x, coords.y);
        // add to the array
        polygonPoints[polygonPoints.length] = {
          x : coords.x,
          y : coords.y
        };
        document.getElementById('points-count').innerHTML = polygonPoints.length;
      }
    }
  };

  canvas.onmouseup = function(e) {
    // check which tab we are on
    if (document.getElementById('add-poi-div').style.display === 'block') {
      // check if this is a left release
      if (e.button === 0) {
        leftDown = false;
      }
    }
  };

  canvas.onmousemove = function(e) {
    // check which tab we are on
    if (document.getElementById('add-poi-div').style.display === 'block') {
      // check if this is a left click
      if (leftDown) {
        // get the coordinates
        var coords = getCanvasEventCoords(e);
        // figure out the angle
        clickTheta = -Math.atan2(coords.y - clickY, coords.x - clickX);
        document.getElementById('theta-poi-display').innerHTML = clickTheta
            * (180 / Math.PI);
      }
    }
  };

  // add a callback to draw on the canvas
  annotator2D.view.addDrawCallback(function() {
    // check which tab we are on
    if (document.getElementById('add-poi-div').style.display === 'block') {
      // check if we have a point to draw
      var poiX = document.getElementById('x-poi-display').innerHTML;
      var poiY = document.getElementById('y-poi-display').innerHTML;
      var poiTheta = document.getElementById('theta-poi-display').innerHTML;
      if (poiX.length + poiY.length + poiTheta.length >= 3) {
        annotator2D.view.drawWorldPoint(poiX, poiY, parseFloat(poiTheta)
            * (Math.PI / 180), 6, '#74A174');
      }
    } else {
      // check if we have enough points
      if (polygonPoints.length > 1) {
        annotator2D.view.drawWorldPolygon(polygonPoints, '#24AB8C');
      } else if (polygonPoints.length === 1) {
        annotator2D.view.drawWorldPoint(polygonPoints[0].x, polygonPoints[0].y,
            null, 3, '#000000');
      }
    }
  });

  Annotator2D.prototype.__proto__ = EventEmitter2.prototype;
};