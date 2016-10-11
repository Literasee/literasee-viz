// make a chart responsive
export function responsivefy(svg) {
  // get container + svg aspect ratio
  var container = d3.select(svg.node().parentNode),
    width = parseInt(svg.style('width')),
    height = parseInt(svg.style('height')),
    aspect = width / height;

  // add viewBox and preserveAspectRatio properties,
  // and call resize so that svg resizes on inital page load
  svg
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .attr('preserveAspectRatio', 'xMinYMid')
    .call(resize);

  // ensure a unique listener is created for every svg passed in
  // even if they share the same parent container
  d3.select(window).on('resize.' + container.attr('id') + Date.now(), resize);

  // get width of container and resize svg to fit it
  function resize() {
    var targetWidth = parseInt(container.style('width'));
    svg.attr('width', targetWidth);
    svg.attr('height', Math.round(targetWidth / aspect));
    // if svgs are absolutely positioned (for layering, etc.)
    // size the parent container to ensure proper layout
    if (svg.style('position') === 'absolute') {
      container.style('height', Math.round(targetWidth / aspect) + 'px');
    }
  }
}

import { default as camelCase } from 'lodash.camelcase';

// convert kebab-case names from URL or HTML attrs to camelCase
export function camelizeKeys (o) {
  var out = {};
  Object.keys(o).forEach(key => out[camelCase(key)] = o[key]);
  return out;
}

// create an object with camelCase keys from the attributes on a DOM element
export function getDataAttributes (selection) {
  if (selection.empty() || !selection.node().hasAttributes()) return {};

  var attrs = selection.node().attributes;
  var o = {};
  for (var i = attrs.length - 1; i > -1; i--) {
    var { name, value } = attrs[i];
    if (name.substr(0, 5) === 'data-') {
      o[name.substr(5)] = value;
    }
  }
  return camelizeKeys(o);
}
