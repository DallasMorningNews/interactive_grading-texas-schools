# Grading Texas Schools

This project was primarily constructed using [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/api/) and [DataTables](https://datatables.net/).

## Map

### Layers

Both school campuses (points) and school districts (polygons) were in the same GeoJSON file. In Mapbox, I imported them under one source, but separated them into different layers as seen in this [example](https://www.mapbox.com/mapbox-gl-js/example/multiple-geometries/). Depending on what the user selects, I am simply showing and hiding layers (see this [example](https://www.mapbox.com/mapbox-gl-js/example/toggle-layers/) on toggling layers).

I did it this way rather than load in two GeoJSON files, primarily because it was easier to have just one file supply the data for the table, and also we avoid making two getJSON calls (though that alone is not substantial enough to warrant this way, in my opinion).

Hover pop ups can be found in this [example](https://www.mapbox.com/mapbox-gl-js/example/popup-on-hover/).

### Filter

The map is filtered based on the selections of the dropdowns and update when they're changed. They're updated using Mapbox's [setFilter()](https://www.mapbox.com/mapbox-gl-js/api/#Map#setFilter) function. Note that setFilter() does not remember or carry over the current filter, so you have to define all filters every time you update the filter.

Here's an example of using [underscore](http://underscorejs.org/) and setFilter() together:

```javascript
var filtered_features = _.filter(data.features, function(d){
  return d.properties.type == some_value;
});

map.setFilter(layer, ['in', "gid"].concat(filtered_features.map(function(feature){
  return feature.properties.gid;
})));

```

I also synced the map filter to the DataTable search bar based on this [example](https://www.mapbox.com/mapbox-gl-js/example/filter-features-within-map-view/) and calling setFilter() within a `$('#searchBar').keyup()` event.

### Legend
The color legend on the map was made with [d3 SVG Legend](http://d3-legend.susielu.com/)

## Table

### Filter

Unlike the mapbox filter, DataTables will store the last filter applied and add onto it. I used the [column().search()](https://datatables.net/reference/api/column%28%29.search%28%29) method.

To clear all searches:

```javascript
table
 .search( '' )
 .columns().search( '' )
 .draw();
```

### Question mark hovers
Tooltips on the question marks were built using [qtip2](http://qtip2.com/)
