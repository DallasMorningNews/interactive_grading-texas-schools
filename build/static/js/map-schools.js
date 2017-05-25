(function(){

  //mapbox instance
  var map = new mapboxgl.Map({
    container: 'map',
    center: [-96.9785, 32.8924],
    zoom: 9,
    style: '//maps.dallasnews.com/styles.json'
  });

  //color grading scale
  var gradeColors = [
    ["A", '#4575b4'],
    ["B", '#74add1'],
    ["C", '#fdae61'],
    ["D", '#f46d43'],
    ["F", '#d73027'],
    ["-", '#636363']];

  //for the legend
  var ordinalColors = d3.scaleOrdinal()
    .domain(["A", "B", "C", "D", "F"])
    .range([ "#4575b4", "#74add1", "#fdae61", "#f46d43", "#d73027"]);

  var data;
  var districtdata;
  var schooltable;
  var indexName;
  var schoolLayer;
  var layer;
  var layerType;

  //taken from mapbox gl
  function normalize(string) {
    return string.trim().toLowerCase();
  }

  //functions to add and remove map layers
  function addLayers(data){
    indexName = "grade"+ $('#categoryIndex').val();

    map.addSource("dataPoints", {
        "type": "geojson",
        "data": data,
        "cluster": false
    });

    map.addLayer({
        "id": "campuses",
        "type": "circle",
        "source": "dataPoints",
        "paint":{
          'circle-radius': {
                'base': 2,
                'stops': [[9, 3], [18, 150]]
            },
          "circle-color":{
            property: indexName,
            type: "categorical",
            stops: gradeColors
          }
        },
        "filter": ["==", "$type", "Point"],
    });

    map.addLayer({
        "id": "districts",
        "type": "fill",
        "source": "dataPoints",
        "paint": {
            "fill-color": {
              property: indexName,
              type: "categorical",
              stops: gradeColors
            },
            "fill-opacity": 0.4,
            "fill-outline-color": '#636363'
        },
        "filter": ["==", "$type", "Polygon"],
        "layout":{
          visibility: 'none'
        }
    });

    //add zoom nav, but disable the compass(removed in css)
    map.addControl(new mapboxgl.NavigationControl());
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    //pop up description on mouseover
    var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.on('mousemove', function(e) {
      var features = map.queryRenderedFeatures(e.point, { layers: ['campuses', 'districts'] });
      map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

      if (!features.length) {
          popup.remove();
          return;
      }

      var feature = features[0];

      var romanNumeral;
      if ($('#categoryIndex').val() == '1'){
        romanNumeral = 'I';
      } else if ($('#categoryIndex').val() == '2') {
        romanNumeral = 'II';
      } else if ($('#categoryIndex').val() == '3') {
        romanNumeral = 'III';
      } else {
        romanNumeral = 'IV';
      }

        popup.setLngLat(map.unproject(e.point))
            .setHTML("<p class='campus'>"+feature.properties.schoolname+"</p><p>"+feature.properties.distname+
                     "</p><p>Category "+romanNumeral+": "+feature.properties[indexName]+"</p>")
            .addTo(map);
    });
  }//add layer function


  function filterBySchool(value){
    indexName = "grade"+$('#categoryIndex').val();
    layer = $('#campusOrDistrict').val();
    layerType = (layer == 'campuses') ? "Point" : "Polygon";
    var letterGrade = $('#grade').val();

    if (value == 'all'){

      if (letterGrade == 'all'){
        map.setFilter(layer, ['all', ['has', 'gid'], ["==", "$type", layerType]]);
      } else {
        filterbyGrade(letterGrade);
      }

      schooltable
        .column(2)
        .search("")
        .draw();

    } else {

      var filtered_features;

      if (letterGrade == 'all'){
        filtered_features = _.filter(data.features, function(d){ return d.properties.type == value; });
      } else {
        filtered_features = _.filter(data.features, function(d){
          return d.properties.type == value && d.properties[indexName] == letterGrade;
        });
      }

      map.setFilter(layer, ['all', ['in', "gid"].concat(filtered_features.map(function(feature){
        return feature.properties.gid;
      })), ["==", "$type", layerType]]);

      schooltable
        .column(2)
        .search(value)
        .draw();
    }
  }

  function filterbyGrade(value){
    var schoolValue = $('#schoolType').val();
    var categoryValue = $('#categoryIndex').val();
    layer = $('#campusOrDistrict').val();
    layerType = (layer == 'campuses') ? "Point" : "Polygon";

    indexName = "grade"+categoryValue;
    var col = 2 + parseInt(categoryValue);
    var letterGrade = value;
    var filtered_grades;

    if (schoolValue == 'all'){
      filtered_grades = _.filter(data.features, function(d){
        return d.properties[indexName] == letterGrade;
      });
    } else{

      filtered_grades = _.filter(data.features, function(d){
        return d.properties.type == schoolValue && d.properties[indexName] == letterGrade;
      });
    }


    map.setFilter(layer, ['all', ['in', "gid"].concat(filtered_grades.map(function(feature){
      return feature.properties.gid;
    })), ["==", "$type", layerType]]);

    schooltable
      .column(col)
      .search(letterGrade)
      .draw();
  }//filter by grade


  function mapboxDraw() {
    $("body").dnLoader("remove");

    addLayers(data);

    //filter data here
    var schoolType;
    var col;

    $('#schoolType').change(function(){
        filterBySchool(this.value);
    }); //change function

    $('#grade').change(function(){
        col = 2 + parseInt($('#categoryIndex').val());

        if (this.value == 'all'){

          filterBySchool($('#schoolType').val());

          schooltable
            .column(col)
            .search("")
            .draw();
        } else {
          filterbyGrade(this.value);
        }
    }); //change function

    $('#categoryIndex').change(function(){
      indexName = "grade"+this.value;
      layer = $('#campusOrDistrict').val();
      var mapProperty = (layer == 'campuses') ? "circle-color" : "fill-color";

      map.setPaintProperty(layer, mapProperty,
        {
          property: indexName,
          type: "categorical",
          stops: gradeColors
        });

      schooltable
       .search( '' )
       .columns().search( '' )
       .draw();

      filterBySchool($('#schoolType').val());
    }); //change function

    $('#clearButton').click(function(){
      layer = $('#campusOrDistrict').val();
      layerType = (layer == 'campuses') ? "Point" : "Polygon";

      map.setFilter(layer, ['all', ['has', 'gid'], ["==", '$type', layerType]]);

      schooltable
       .search( '' )
       .columns().search( '' )
       .draw();
     $('#categoryIndex').val('1');
     $('#schoolType').val('all');
     $('#grade').val('all');
    }); //clear function

    $('input[type=search]').keyup(function(e){
      $('#categoryIndex').val('1');
      $('#schoolType').val('all');
      $('#grade').val('all');

      layer = $('#campusOrDistrict').val();
      layerType = (layer == 'campuses') ? "Point" : "Polygon";

      var searchValue = normalize(e.target.value);
      var filtered_search = _.filter(data.features, function(d){
        var schoolname = normalize(d.properties.schoolname);
        var distname = normalize(d.properties.distname);
        return (schoolname.indexOf(searchValue) > -1 || distname.indexOf(searchValue) > -1) && (schoolname !== '-');
      });

      map.setFilter(layer, ['all', ['in', "gid"].concat(filtered_search.map(function(feature){
        return feature.properties.gid;
      })), ["==", "$type", layerType]]);

    });//input function

    $("#campusOrDistrict").change(function(){
      $('#categoryIndex').val('1');
      $('#schoolType').val('all');
      $('#grade').val('all');

      var newSelection = this.value;

      var oldSelection = (newSelection == 'campuses') ? 'districts' : 'campuses';

      map.setLayoutProperty(oldSelection, 'visibility', 'none');
      map.setLayoutProperty(newSelection, 'visibility', 'visible');

      if (newSelection == 'districts'){
        $('#schoolType').prop('disabled', true);
      } else {
        $('#schoolType').prop('disabled', false);
      }

    });
  }

  var drawMap = _.after(2, mapboxDraw);

  map.on('load', drawMap);

  $.getJSON('assets/accountability_ratings.json', function(json_data){

      data = JSON.parse(JSON.stringify(json_data));

      var map_data = _.filter(data.features, function(d){ return d.properties.gid !== null; });
      data.features = map_data;


      drawMap();

      schooltable = $('#schoolTable').DataTable({
        "data": json_data.features,
        "columns":[
          {data: "properties.schoolname"},
          {data: "properties.distname"},
          {data: "properties.type"},
          {data: "properties.grade1"},
          {data: "properties.grade2"},
          {data: "properties.grade3"},
          {data: "properties.grade4"},
          {data: "properties.rating"},
          {data: "properties.lowinc"}],
        "scrollX": true,
        "order": [[ 1, "asc" ], [0, "asc"]]
        });
    // });
  });

  //question mark tooltips
  $('#schoolInfo').qtip({
    style: { classes: 'qtip-default qtip-light qtip-shadow'},
    content: {
        text: 'E = Elementary<br/>M = Middle School<br/>H = High School<br/>'+
        'B = Blended',
        title: 'School Level',
        button: true
    },
    position: {
        my: 'top center',
        at: 'bottom center',
        target: $('#schoolInfo')
    }
  });
  $('#ratingInfo').qtip({
    style: { classes: 'qtip-light qtip-shadow'},
    content: {
        text: 'Actual rating given by state.<br/>M = Met Standard<br/>A = Met Alternative Standard<br/>'+
        'I = Improvement Required<br/>Q/X/Z = Not Rated',
        title: '2016 Rating',
        button: true
    },
    position: {
        my: 'top right',
        at: 'bottom center',
        target: $('#ratingInfo')
    }
  });
  $('#povertyInfo').qtip({
    style: { classes: 'qtip-light qtip-shadow'},
    content: {
        text: 'The percentage of students who are economically disadvantaged.',
        title: 'Percent Low Income',
        button: true
    },
    position: {
        my: 'top right',
        at: 'bottom center',
        target: $('#povertyInfo')
    }
  });

  //make legend
  var svg = d3.select('#legendScale');

  svg.append('g')
    .attr('class', 'legendLinear')
    .attr("transform", "translate(5,5)");

  var legend = d3.legendColor()
    .shapeWidth(30)
    .orient('horizontal')
    .scale(ordinalColors);

  svg.select(".legendLinear")
    .call(legend);

})();
