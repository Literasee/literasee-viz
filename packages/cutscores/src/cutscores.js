import { parse } from 'query-string';
import { customizeCuts } from './utils';

// convert kebab-case names from URL or HTML attrs to camelCase
function camelize (o) {
  var out = {};
  Object.keys(o).forEach(key => out[_.camelCase(key)] = o[key]);
  return out;
}

// create an object with camelCase keys from the attributes on a DOM element
function getAttrs (selection) {
  if (selection.empty() || !selection.node().hasAttributes()) return {};

  var attrs = selection.node().attributes;
  var o = {};
  for (var i = attrs.length - 1; i > -1; i--) {
    var { name, value } = attrs[i];
    if (name.substr(0, 5) === 'data-') {
      o[name.substr(5)] = value;
    }
  }
  return camelize(o);
}

export default function (selector = 'body', args) {
  let container = d3.select(selector);
  let attrs = getAttrs(container);
  let urlVars = camelize(parse(location.search));

  // get options using the following priority order:
  // 1. args passed in the function call
  // 2. data-* attributes set on target DOM elements
  // 3. URL querystring values
  // 4. defaults defined below
  let {
    state = 'CO',
    subject, // default subject is whatever is listed first in the data
    minYear = 1900,
    maxYear = 2100,
    student
  } = _.defaults(args, attrs, urlVars);

  // options clean up
  state = state.toUpperCase();
  minYear = parseInt(minYear, 10);
  maxYear = parseInt(maxYear, 10);

  // load, parse, and filter data
  let base = window.location.hostname === 'localhost'
    ? 'http://localhost:4000'
    : 'https://literasee.github.io/cutscores';

  d3.json(
    `${base}/sgp/${state}.json`,
    (err, data) => {
      const stateData = filterStateData(data, subject, minYear, maxYear);

      if (!student) {
        renderChart(stateData, container);
      } else {
        d3.json(
          `${base}/students/${student}.json`,
          (err, data) => {
            const studentData = data.data.subjects[stateData.subject];
            stateData.cuts = customizeCuts(stateData.cuts, studentData);
            renderChart(stateData, container, studentData);
          }
        );
      }
    }
  );
}

function filterStateData (data, subject, minYear, maxYear) {
  var chartData = _
    .chain(data.data)
    .tap(function (arr) {
      if (!subject) subject = arr[0].subject;
    })
    .filter(function (o) {
      return o.subject === subject;
    })
    .filter(function (o) {
      // if either param falls within the bounds of a set of cuts
      if (minYear >= o.minYear && minYear <= o.maxYear) return true;
      if (maxYear >= o.minYear && maxYear <= o.maxYear) return true;

      if (minYear < o.minYear && maxYear >= o.minYear) return true;
      if (maxYear > o.maxYear && minYear <= o.maxYear) return true;
    })
    .sortBy(data, 'maxYear')
    .last() // remove this when multiple sets of cuts are supported
    .value();

  return chartData;
}

function renderChart (data, container, scores) {
  var margin = { top: 0, right: 0, bottom: 20, left: 0 };
  var width = 800 - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom;
  var colors = ['#525252', '#737373', '#969696', '#BDBDBD', '#D9D9D9'];

  var cut_scores = data.cuts;
  var numLevels = data.levels.length;

  // base with margins
  var svg = container
    .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .call(responsivefy)
    .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // chart runs from loss to hoss
  var yScale = d3.scaleLinear()
    .domain([d3.min(cut_scores, n => n.loss), d3.max(cut_scores, n => n.hoss)])
    .range([height, 0]);

  // Y axes, for debugging only
  // svg.call(d3.axisLeft(yScale));
  // svg.append('g').attr('transform', `translate(${width}, 0)`).call(d3.axisRight(yScale));

  // to create a "gutter" and prevent our min and max values from being plotted
  // right on the edges of our chart, we need to create some fake data entries
  // we will essentially find the min and max grades and create entries
  // slightly below and above them, respectively

  // 0 to 1, how much of a "grade" should the gutters represent?
  var gutter = 0.5;
  // use position in the cuts array to represent level over time
  _.forEach(cut_scores, (d, i) => d.level = i);
  // duplicate the first item and put it at the front
  cut_scores.unshift(_.clone(cut_scores[0]));
  // decrease cloned item's level by gutter amount
  cut_scores[0].level -= gutter;
  cut_scores[0].test = null;
  // duplicate the last item and put it at the end
  cut_scores.push(_.clone(cut_scores[cut_scores.length - 1]));
  // increase cloned item's level by gutter amount
  cut_scores[cut_scores.length - 1].level += gutter;
  cut_scores[cut_scores.length - 1].test = null;

  // create a linear X scale based on our constructed levels
  var xScale = d3.scaleLinear()
    .domain(d3.extent(_.map(cut_scores, 'level')))
    .range([0, width]);

  // create an X axis using the original length of cut_scores as number of ticks
  var xAxis = d3.axisBottom(xScale)
    .ticks(cut_scores.length - 2)
    .tickFormat((d, i) => {
      // use the actual label field for tick labels
      // +1 skips the fake data point we created at the front of the array
      return `${cut_scores[i+1].test} ${cut_scores[i+1].year}`;
    })
    .tickSizeOuter(0);

  // draw X axis below chart
  svg
    .append('g').attr('transform', `translate(0, ${height})`)
    .call(xAxis);

  // generate keys from data
  var keys = ['hoss'];
  for (var i = numLevels - 1; i > 0; i--) {
    keys.unshift('cut' + i);
  }

  // generate state by calculating diffs between cuts
  var stack = d3.stack()
    .keys(keys)
    .offset((series, order) => {
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
          if (i === series.length - 1) series[i][j][1] = yScale.domain()[1];
        }
      }
    });

  var area = d3.area()
    .x(d => xScale(d.data.level))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
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
    .style('fill', (d) => {
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
    .attr('y', (d, i) => {
      var datum = d[0];
      // datum[0] is the bottom value, datum[1] the top
      var mid = datum[0] + ((datum[1] - datum[0]) / 2);
      return yScale(mid);
    })
    .attr('dy', '0.4em')
    .style('fill-opacity', 0)
    .text((d, i) => data.levels[i].label);

  // next line only needed if chart will be updated
  // bands.attr('d', area);

  // alert parent of new size
  if (window['pym']) new pym.Child().sendHeight();
  if (!scores) return;

  svg
    .selectAll('circle')
    .data(scores)
    .enter()
    .append('circle')
      .attr('r', 10)
      .attr('cx', (d, i) => {
        return xScale(_.find(cut_scores, {test: d.test, year: d.year}).level);
      })
      .attr('cy', (d, i) => yScale(d.score))
      .style('fill', 'red')
      .style('fill-opacity', 0.4);
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
