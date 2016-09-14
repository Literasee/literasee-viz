var margin = { top: 10, right: 40, bottom: 60, left: 40 };
var width = 800 - margin.left - margin.right;
var height = 400 - margin.top - margin.bottom;
var colors = ['#525252', '#737373', '#969696', '#BDBDBD', '#D9D9D9'];

var queryParams = parseQueryString();
var state = (queryParams.state || 'CO').toUpperCase();
var subject = queryParams.subject;
var minYear = queryParams['min-year'];
var maxYear = queryParams['max-year'];

function getDataBySubject (subject, data) {
  if (!subject) subject = data[0].subject;

  return data.filter(s => s.subject === subject);
}

function getDataForYears (minYear, maxYear, data) {
  // default to most current cuts
  if (!minYear && !maxYear) {
    return _.sortBy(data, 'maxYear').reverse()[0];
  }
}

d3.json(
  `https://raw.githubusercontent.com/CenterForAssessment/cutscores/master/${state}.json`,
  function (err, data) {
    if (err) throw err;

    var chartData = getDataForYears(
      minYear,
      maxYear,
      getDataBySubject(subject, data.data)
    );

    renderChart(chartData);
  }
);

function renderChart (data) {
  var svg = d3.select('#chart')
    .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .call(responsivefy)
    .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  var cut_scores = data.cuts;
  var numLevels = data.labels.length;
  var yScale = d3.scaleLinear()
    .domain([d3.min(cut_scores, n => n.loss), d3.max(cut_scores, n => n.hoss)])
    .range([height, 0]);

  svg.call(d3.axisLeft(yScale));
  svg
    .append('g')
      .attr('transform', `translate(${width}, 0)`)
    .call(d3.axisRight(yScale));

  var xScale = d3.scalePoint()
    .domain(cut_scores.map(d => d.label))
    .range([0, width]);

  svg
    .append('g')
      .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(5));

  var keys = ['hoss'];
  for (var i = numLevels - 1; i > 0; i--) {
    keys.unshift('cut' + i);
  }
  var z = d3.scaleOrdinal(colors).domain(keys);

  var stack = d3.stack()
    .keys(keys)
    .offset((series, order) => {
      for (var i = series.length - 1; i > -1; i--) {
        for (var j = 0; j < series[i].length; j++) {

          if (i === 0) {
            series[i][j][0] = yScale.domain()[0];
          } else {
            series[i][j][0] = series[i - 1][j][1];
          }
          // top band fills chart area
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

  // basic update, no transitions
  bands.exit().remove();
  bands
    .enter()
      .append('path')
      .attr('class', 'layer')
      .style('fill', (d) => {
        return z(d.key);
      })
      .style('fill-opacity', 0.5)
      .attr('d', area);
  bands
    .attr('d', area);

  new pym.Child().sendHeight();
}
