(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

var index$2 = function (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};

/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var index$4 = shouldUseNative() ? Object.assign : function (target, source) {
	var arguments$1 = arguments;

	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments$1[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

var strictUriEncode = index$2;
var objectAssign = index$4;

function encode(value, opts) {
	if (opts.encode) {
		return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
	}

	return value;
}

var parse = function (str) {
	// Create an object with no prototype
	// https://github.com/sindresorhus/query-string/issues/47
	var ret = Object.create(null);

	if (typeof str !== 'string') {
		return ret;
	}

	str = str.trim().replace(/^(\?|#|&)/, '');

	if (!str) {
		return ret;
	}

	str.split('&').forEach(function (param) {
		var parts = param.replace(/\+/g, ' ').split('=');
		// Firefox (pre 40) decodes `%3D` to `=`
		// https://github.com/sindresorhus/query-string/pull/37
		var key = parts.shift();
		var val = parts.length > 0 ? parts.join('=') : undefined;

		key = decodeURIComponent(key);

		// missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		val = val === undefined ? null : decodeURIComponent(val);

		if (ret[key] === undefined) {
			ret[key] = val;
		} else if (Array.isArray(ret[key])) {
			ret[key].push(val);
		} else {
			ret[key] = [ret[key], val];
		}
	});

	return ret;
};

// convert kebab-case names from URL or HTML attrs to camelCase
function camelize (o) {
  var out = {};
  Object.keys(o).forEach(function (key) { return out[_.camelCase(key)] = o[key]; });
  return out;
}

// create an object with camelCase keys from the attributes on a DOM element
function getAttrs (selection) {
  if (selection.empty() || !selection.node().hasAttributes()) { return {}; }

  var attrs = selection.node().attributes;
  var o = {};
  for (var i = attrs.length - 1; i > -1; i--) {
    var ref = attrs[i];
    var name = ref.name;
    var value = ref.value;
    if (name.substr(0, 5) === 'data-') { name = name.substr(5); }
    o[name] = value;
  }
  return camelize(o);
}

var cutscores = function (selector, args) {
  if ( selector === void 0 ) selector = 'body';

  var container = d3.select(selector);
  var attrs = getAttrs(container);
  var urlVars = camelize(parse(location.search));

  // get options using the following priority order:
  // 1. args passed in the function call
  // 2. data-* attributes set on target DOM elements
  // 3. URL querystring values
  // 4. defaults defined below
  var ref = _.defaults(args, attrs, urlVars);
  var state = ref.state; if ( state === void 0 ) state = 'CO';
  var subject = ref.subject;
  var minYear = ref.minYear; if ( minYear === void 0 ) minYear = 1900;
  var maxYear = ref.maxYear; if ( maxYear === void 0 ) maxYear = 2100;

  // options clean up
  state = state.toUpperCase();
  minYear = parseInt(minYear, 10);
  maxYear = parseInt(maxYear, 10);

  // load, parse, and filter data
  d3.json(
    ("https://literasee.github.io/cutscores/" + state + ".json"),
    function (err, data) {
      if (err) { throw err; }

      var chartData = _
        .chain(data.data)
        .tap(function (arr) {
          if (!subject) { subject = arr[0].subject; }
        })
        .filter(function (o) {
          return o.subject === subject;
        })
        .filter(function (o) {
          // if either param falls within the bounds of a set of cuts
          if (minYear >= o.minYear && minYear <= o.maxYear) { return true; }
          if (maxYear >= o.minYear && maxYear <= o.maxYear) { return true; }

          if (minYear < o.minYear && maxYear >= o.minYear) { return true; }
          if (maxYear > o.maxYear && minYear <= o.maxYear) { return true; }
        })
        .sortBy(data, 'maxYear')
        .last() // remove this when multiple sets of cuts are supported
        .value();

      renderChart(chartData, container);
    }
  );
}

function renderChart (data, container) {
  var margin = { top: 0, right: 0, bottom: 20, left: 0 };
  var width = 800 - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom;
  var colors = ['#525252', '#737373', '#969696', '#BDBDBD', '#D9D9D9'];

  var cut_scores = data.cuts;
  var numLevels = data.labels.length;

  // base with margins
  var svg = container
    .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .call(responsivefy)
    .append('g')
      .attr('transform', ("translate(" + (margin.left) + ", " + (margin.top) + ")"));

  // chart runs from loss to hoss
  var yScale = d3.scaleLinear()
    .domain([d3.min(cut_scores, function (n) { return n.loss; }), d3.max(cut_scores, function (n) { return n.hoss; })])
    .range([height, 0]);

  // Y axes, for debugging only
  // svg.call(d3.axisLeft(yScale));
  // svg.append('g').attr('transform', `translate(${width}, 0)`).call(d3.axisRight(yScale));

  // to create a "gutter" and prevent our min and max values from being plotted
  // right on the edges of our chart, we need to create some fake data entries
  // we will essentially find the min and max grades and create entries
  // slightly below and above them, respectively

  // 0 to 1, how much of a "grade" should the gutters represent?
  var gutter = 0.25;
  // use position in the cuts array to represent level over time
  _.forEach(cut_scores, function (d, i) { return d.level = i; });
  // duplicate the first item and put it at the front
  cut_scores.unshift(_.clone(cut_scores[0]));
  // decrease cloned item's level by gutter amount
  cut_scores[0].level -= gutter;
  // duplicate the last item and put it at the end
  cut_scores.push(_.clone(cut_scores[cut_scores.length - 1]));
  // increase cloned item's level by gutter amount
  cut_scores[cut_scores.length - 1].level += gutter;

  // create a linear X scale based on our constructed levels
  var xScale = d3.scaleLinear()
    .domain(d3.extent(_.map(cut_scores, 'level')))
    .range([0, width]);

  // create an X axis using the original length of cut_scores as number of ticks
  var xAxis = d3.axisBottom(xScale)
    .ticks(cut_scores.length - 2)
    .tickFormat(function (d, i) {
      // use the actual label field for tick labels
      // +1 skips the fake data point we created at the front of the array
      return cut_scores[i+1].label;
    })
    .tickSizeOuter(0);

  // draw X axis below chart
  svg
    .append('g').attr('transform', ("translate(0, " + height + ")"))
    .call(xAxis);

  // generate keys from data
  var keys = ['hoss'];
  for (var i = numLevels - 1; i > 0; i--) {
    keys.unshift('cut' + i);
  }

  // generate state by calculating diffs between cuts
  var stack = d3.stack()
    .keys(keys)
    .offset(function (series, order) {
      for (var i = series.length - 1; i > -1; i--) {
        for (var j = 0; j < series[i].length; j++) {
          // bottom band runs from loss to cut1
          // others run from prev cut
          if (i === 0) {
            series[i][j][0] = yScale.domain()[0];
          } else {
            series[i][j][0] = series[i - 1][j][1];
          }

          // top band runs from last cut to hoss to fill chart area
          if (i === series.length - 1) { series[i][j][1] = yScale.domain()[1]; }
        }
      }
    });

  var area = d3.area()
    .x(function (d) { return xScale(d.data.level); })
    .y0(function (d) { return yScale(d[0]); })
    .y1(function (d) { return yScale(d[1]); })
    .curve(d3.curveCatmullRom.alpha(0.5));

  var bands = svg
    .selectAll('.layer')
    .data(stack(cut_scores))
    .enter()
      .append('g')
      .attr('class', 'layer')
      .on('mouseover', function () {
        d3.select(this)
          .select('path')
          .style('fill-opacity', 0.5)
          .style('stroke-width', 0.8);

        d3.select(this)
          .select('text')
          .style('fill-opacity', 1);
      })
      .on('mouseout', function () {
        d3.select(this)
          .select('path')
          .style('fill-opacity', 0.5)
          .style('stroke-width', .1);

        d3.select(this)
          .select('text')
          .style('fill-opacity', 0);
      });

  // next line only needed if chart will be updated
  // bands.exit().remove();

  // chart is (currently) only rendered once, so everything happens in enter
  bands
    .append('path')
    .style('fill', function (d) {
      return d3.scaleOrdinal(colors).domain(keys)(d.key);
    })
    .style('fill-opacity', 0.5)
    .style('stroke', 'black')
    .style('stroke-width', .1)
    .attr('d', area);

  bands
    .append('text')
    .attr('font-size', 11)
    .attr('font-family', 'sans-serif')
    .attr('x', 5)
    .attr('y', function (d, i) {
      var datum = d[0];
      // datum[0] is the bottom value, datum[1] the top
      var mid = datum[0] + ((datum[1] - datum[0]) / 2);
      return yScale(mid);
    })
    .attr('dy', '0.4em')
    .style('fill-opacity', 0)
    .text(function (d, i) { return data.labels[i].label; });

  // next line only needed if chart will be updated
  // bands.attr('d', area);

  // alert parent of new size
  if (window['pym']) { new pym.Child().sendHeight(); }
}

// make a chart responsive
function responsivefy(svg) {
  // get container + svg aspect ratio
  var container = d3.select(svg.node().parentNode),
      width = parseInt(svg.style("width")),
      height = parseInt(svg.style("height")),
      aspect = width / height;

  // add viewBox and preserveAspectRatio properties,
  // and call resize so that svg resizes on inital page load
  svg.attr("viewBox", "0 0 " + width + " " + height)
      .attr("preserveAspectRatio", "xMinYMid")
      .call(resize);

  d3.select(window).on("resize." + container.attr("id"), resize);

  // get width of container and resize svg to fit it
  function resize() {
      var targetWidth = parseInt(container.style("width"));
      svg.attr("width", targetWidth);
      svg.attr("height", Math.round(targetWidth / aspect));
  }
}

exports.cutscores = cutscores;

Object.defineProperty(exports, '__esModule', { value: true });

})));
