//setup Leaflet map
var windowHeight = $(window).height();
$("#map").height(windowHeight);
$("#infoWrapper").height(windowHeight);

var mapAttribution = '<a href="https://www.mapbox.com/" target="_blank">Mapbox</a> | Base map data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> | &copy; <a href="http://redcross.org" title="Red Cross" target="_blank">Red Cross</a> 2014, CC-BY | <a title="Disclaimer" onClick="showDisclaimer();">Disclaimer</a>';
var HOTAttribution = 'Base map data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> | Map style by <a href="http://hot.openstreetmap.org" target="_blank">H.O.T.</a> | &copy; <a href="http://redcross.org" title="Red Cross" target="_blank">Red Cross</a> 2014, CC-BY | <a title="Disclaimer" onClick="showDisclaimer();">Disclaimer</a>';

var mapboxStreetsUrl = 'http://{s}.tiles.mapbox.com/v3/americanredcross.hmki3gmj/{z}/{x}/{y}.png',
  mapboxTerrainUrl = 'http://{s}.tiles.mapbox.com/v3/americanredcross.hc5olfpa/{z}/{x}/{y}.png',
  greyscaleUrl = 'http://{s}.tiles.mapbox.com/v3/americanredcross.i4d2d077/{z}/{x}/{y}.png',
  hotUrl = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  mapboxSatUrl = 'http://{s}.tiles.mapbox.com/v3/americanredcross.inlanejo/{z}/{x}/{y}.png';
var mapboxStreets = new L.TileLayer(mapboxStreetsUrl, {attribution: mapAttribution, maxZoom: 20}),
  mapboxTerrain = new L.TileLayer(mapboxTerrainUrl, {attribution: mapAttribution, maxZoom: 20}),
  greyscale = new L.TileLayer(greyscaleUrl, {attribution: mapAttribution, maxZoom: 20}),
  hot = new L.TileLayer(hotUrl, {attribution: HOTAttribution, maxZoom: 20}),
  mapboxSat = new L.TileLayer(mapboxSatUrl, {attribution: mapAttribution, maxZoom: 17});

var map = new L.Map("map", {
	center: [10.8071, 124.9706],
	zoom: 16,
	minZoom: 9,
	zoomControl: false,
  // scrollWheelZoom: false,
  	layers: [hot]
});



var baseMaps = {
	"Grey": greyscale,
	"Streets": mapboxStreets,
	"Terrain": mapboxTerrain,
	"HOT": hot,
  "Mapbox satellite": mapboxSat
};

L.control.layers(baseMaps).addTo(map);

// Add our Leaflet zoom control manually where we want it
var zoomControl = L.control.zoom({
    position: 'topleft'
});
map.addControl(zoomControl);

// initialize the SVG layer for D3 drawn survey points
map._initPathRoot()

// pick up the SVG from the map object
var svg = d3.select("#map").select("svg");

var bufferGroup = svg.append('g').attr("id", "buffers");
var houseGroup = svg.append('g').attr("id", "houses");
var houseWithinGroup = svg.append('g').attr("id", "housesWithin");
var pumpGroup = svg.append('g').attr("id", "pumps");

function projectPoint(x, y) {
  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}
var transform = d3.geo.transform({point: projectPoint}),
    path = d3.geo.path().projection(transform);

var housesData;
var pumpsData;


function reverseCoordinates(coordinatesArray){
  return [coordinatesArray[1], coordinatesArray[0]];
}

function mapHouses(){
  d3.json("data/houses-Danao-MacArthur.json", function(error, json) {
    if (error) return console.warn(error);
    housesData = json;
    var mappedHouses = houseGroup.selectAll("circle")
      .data(json.features)
      .enter().append("circle").attr("r", 4).attr('stroke','#222222')
      .attr("fill-opacity", 0.0)
      // .style('display','inline')
      .attr('class','mapped-house')  
      .on("click",clickedHouse);
    // when map view changes adjust the locations of the svg circles
    function updateMarkerHouses(){
      mappedHouses.attr("cx",function(d) {
        return map.latLngToLayerPoint(reverseCoordinates(d.geometry.coordinates)).x}
      );
      mappedHouses.attr("cy",function(d) { 
        return map.latLngToLayerPoint(reverseCoordinates(d.geometry.coordinates)).y}
      );
    }
    map.on("viewreset", updateMarkerHouses);
    updateMarkerHouses();
    mapPumps();
  });
}

function mapPumps(){
  d3.json("data/danao_4pumps.json", function(error, json) {
    if (error) return console.warn(error);
    pumpsData = json;
    var mappedPumps = pumpGroup.selectAll("circle")
      .data(json.features)
      .enter().append("circle").attr("r", 6).attr('stroke','none')
      .attr("fill", "blue").attr("fill-opacity",0.8)
      .attr('class','mapped-pump')
      .on("click",clickedPump);
    // when map view changes adjust the locations of the svg circles
    function updateMarkerPumps(){
      mappedPumps.attr("cx",function(d) { 
        return map.latLngToLayerPoint(reverseCoordinates(d.geometry.coordinates)).x}
      );
      mappedPumps.attr("cy",function(d) { 
        return map.latLngToLayerPoint(reverseCoordinates(d.geometry.coordinates)).y}
      );
    }
    map.on("viewreset", updateMarkerPumps);
    updateMarkerPumps();
    
  });  
}

function clickedHouse(){}

var displayInteger = d3.format('.0f');

$('#slider-buffer').noUiSlider({
  start: [ 50 ],
  step: 10,
  range: {
    'min': [ 0 ],
    'max': [ 400 ]
  },
  format: {
    to: function ( value ) {
    return displayInteger(value);
    },
    from: function ( value ) {
    return displayInteger(value);
    }
  }
}).on({
  slide: function(){ updateBuffers(); },
  set: function(){ updateBuffers(); },
  change: function(){ updateBuffers(); }
});

$('#slider-buffer').Link('lower').to($("#slider-buffer-value"));





function clickedPump(e){
  // -e- is the data object, -this- is the svg circle element
  var pumpMarker = d3.select(this);
  pumpMarker.classed("selected-pump", !pumpMarker.classed("selected-pump"));
  updateBuffers();
}




function updateBuffers(){
  $('#buffers').empty();

  var input = {
    "type": "FeatureCollection",
    "features": []
  };
  pumpGroup.selectAll("circle").filter(function(d){
    return d3.select(this).classed('selected-pump');
  }).each(function(d) {input.features.push(d);});
  
  if(input.features.length > 0){  
    // get buffer distance
    var bufferDistance = parseInt($('#slider-buffer').val());
    // get FeatureCollection of buffers
    var buffers = turf.buffer(input, bufferDistance, 'meters');

    if(input.features.length !== buffers.features[0].geometry.coordinates.length){
      console.log("..........input features..........");
      console.log(input.features);
      console.log(JSON.stringify(input));
      console.log("..........buffers multipolygon coordinates array..........");
      console.log(buffers.features[0].geometry.coordinates);
      console.log(JSON.stringify(buffers));
    }

    // draw buffers on map
    var mappedBuffers = bufferGroup.selectAll("path")
        .data(buffers.features)
        .enter().append("path")
        .attr("class", "mapped-buffer")
        .attr("d",path)
      function updateBufferPaths(){
        mappedBuffers.attr("d", path);
      }
      map.on("viewreset", updateBufferPaths);
  }
  updateHouses(buffers);  
}

function updateHouses(buffers){
  $('#housesWithin').empty();
  $("#housesWithinCount").html("0");
  if(buffers.features.length > 0) {
    var housesWithin = turf.within(housesData, buffers);
    var mappedHousesWithin = houseWithinGroup.selectAll("circle")
        .data(housesWithin.features)
        .enter().append("circle").attr("r", 4).attr('stroke','#222222')
        .attr("fill", "#ed1b2e")
        .attr('class','');
      // when map view changes adjust the locations of the svg circles
      function updatemarker_houseswithin(){
        mappedHousesWithin.attr("cx",function(d) {
          return map.latLngToLayerPoint(reverseCoordinates(d.geometry.coordinates)).x}
        );
        mappedHousesWithin.attr("cy",function(d) { 
          return map.latLngToLayerPoint(reverseCoordinates(d.geometry.coordinates)).y}
        );
      }
      map.on("viewreset", updatemarker_houseswithin);
      updatemarker_houseswithin();

      $("#housesWithinCount").html(housesWithin.features.length);
  }
}



mapHouses();
