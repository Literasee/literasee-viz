var margin = { top: 10, right: 40, bottom: 60, left: 40 };
var width = 800 - margin.left - margin.right;
var height = 400 - margin.top - margin.bottom;
var colors = ['#525252', '#737373', '#969696', '#BDBDBD', '#D9D9D9'];

var queryParams = parseQueryString();
var state = (queryParams.state || 'CO').toUpperCase();
var subject = queryParams.subject;
var minYear = queryParams['min-year'] || 1900;
var maxYear = queryParams['max-year'] || 2100;

d3.json(
  `https://raw.githubusercontent.com/CenterForAssessment/cutscores/master/${state}.json`,
  function (err, data) {
    if (err) throw err;

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

    renderChart(chartData);
  }
);

function renderChart (data) {
  var cut_scores = data.cuts;
  var numLevels = data.labels.length;

  // base with margins
  var svg = d3.select('#chart')
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

  var xScale = d3.scalePoint()
    .domain(cut_scores.map(d => d.label))
    .range([0, width]);

  svg
    .append('g')
      .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

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
    .x(d => xScale(d.data.label))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveCatmullRom.alpha(0.5));

  var bands = svg
    .selectAll('.layer')
    .data(stack(cut_scores));

  // next line only needed if chart will be updated
  // bands.exit().remove();

  // chart is (currently) only rendered once, so everything happens in enter
  bands
    .enter()
      .append('path')
      .attr('class', 'layer')
      .style('fill', (d) => {
        return d3.scaleOrdinal(colors).domain(keys)(d.key);
      })
      .style('fill-opacity', 0.5)
      .attr('d', area);

  // next line only needed if chart will be updated
  // bands.attr('d', area);

  // when running in an iframe, alert parent of new size
  new pym.Child().sendHeight();
}
