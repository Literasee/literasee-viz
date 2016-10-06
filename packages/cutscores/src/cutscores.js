import { default as getDataParameters } from './getDataParameters';
import { default as loadData } from './loadData';

import mergeCutsAndScores from './mergeCutsAndScores';
import { responsivefy } from './utils';

var w = 800;
var h = 400;
var margin = { top: 0, right: 0, bottom: 30, left: 0 };
var width = w - margin.left - margin.right;
var height = h - margin.top - margin.bottom;

export default function (selector = 'body', args) {
  const container = d3.select(selector);
  const params = getDataParameters(selector, args);

  loadData(params)
    .then(({stateData, studentData}) => {

      const allCuts = _.flatten(_.map(stateData, 'cuts'));

      if (studentData) {
        const subjectData = studentData.data.subjects[stateData[0].subject];

        stateData.forEach(cutscoreSet => {
          // get the ratio before modifying the cuts
          var ratio = cutscoreSet.cuts.length / allCuts.length;

          // merging with student data has to be first because
          // it can remove (skipped) or duplicate (repeated) tests
          cutscoreSet.cuts = mergeCutsAndScores(cutscoreSet.cuts, subjectData);
          // create level props and dummy tests at beginning and end of list
          cutscoreSet.cuts = createGutterCuts(cutscoreSet.cuts);
          // create scales using fully transformed list of cuts/tests
          const { x, y } = createScales(cutscoreSet.cuts);

          if (ratio < 1) {
            x.range([0, w * ratio - margin.left - margin.right]);

            container
              .append('div')
              .attr('id', Date.now())
              .style('width', ratio * 100 + '%')
              .style('display', 'inline-block')
              .call(drawBackground, cutscoreSet, x, y, ratio)
              .call(drawScores, cutscoreSet, x, y, ratio, subjectData);
          } else {
            container
              .call(drawBackground, cutscoreSet, x, y)
              .call(drawScores, cutscoreSet, x, y, ratio, subjectData);
          }
        });
      } else {
        const cutscoreSet = stateData.pop();
        cutscoreSet.cuts = createGutterCuts(cutscoreSet.cuts);
        const { x, y } = createScales(cutscoreSet.cuts);
        container.call(drawBackground, cutscoreSet, x, y);
      }

    });
}

function createGutterCuts (cuts) {
  // to create a "gutter" and prevent our min and max values from being plotted
  // right on the edges of our chart, we need to create some fake data entries
  // we will essentially find the min and max grades and create entries
  // slightly below and above them, respectively

  // 0 to 1, how much of a "grade" should the gutters represent?
  var gutter = 0.5;
  var n = cuts.length;

  return [].concat(
    _.merge(_.clone(cuts[0]), {level: -gutter, test: null}),
    cuts.map((cut, i) => {
      return _.merge(_.clone(cut), {level: i})
    }),
    _.merge(_.clone(cuts[n - 1]), {level: n - gutter, test: null})
  );
}

function createScales (cuts) {
  return {
    x: d3.scaleLinear()
         .domain(d3.extent(_.map(cuts, 'level')))
         .range([0, width]),
    y: d3.scaleLinear()
         .domain([
           d3.min(cuts, n => n.loss),
           d3.max(cuts, n => n.hoss)
         ])
         .range([height, 0])
  };
}


function drawBackground (selection, data, x, y, ratio = 1) {
  var colors = ['#525252', '#737373', '#969696', '#BDBDBD', '#D9D9D9'];

  var cut_scores = data.cuts;
  var numLevels = data.levels.length;

  // base with margins
  var svg = selection
    .append('svg')
      .attr('width', width * ratio + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .call(responsivefy)
    .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // create an X axis using the original length of cut_scores as number of ticks
  var xAxis = d3.axisBottom(x)
    .ticks(cut_scores.length - 2)
    .tickFormat((d, i) => {
      // use the test field for tick labels
      // +1 skips the fake data point we created at the front of the array
      var realCut = cut_scores[i+1];
      if (realCut.year) return `${realCut.test} / ${realCut.year}`;
      return `${realCut.test}`;
    })
    .tickSizeOuter(0);

  // draw X axis below chart
  svg
    .append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis);

  // Y axes, for debugging only
  // svg.append('g').call(d3.axisLeft(y));
  // svg.append('g').attr('transform', `translate(${width}, 0)`).call(d3.axisRight(y));


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
            series[i][j][0] = y.domain()[0];
          } else {
            series[i][j][0] = series[i - 1][j][1];
          }

          // top band runs from last cut to hoss to fill chart area
          if (i === series.length - 1) series[i][j][1] = y.domain()[1];
        }
      }
    });

  var area = d3.area()
    .x(d => x(d.data.level))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
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
      return y(mid);
    })
    .attr('dy', '0.4em')
    .style('fill-opacity', 0)
    .text((d, i) => data.levels[i].label);

  // next line only needed if chart will be updated
  // bands.attr('d', area);

  // alert parent of new size
  if (window['pym']) new pym.Child().sendHeight();
}

function drawScores (selection, cutscoreSet, x, y, ratio = 1, scores) {
  selection.style('position', 'relative');
  var svg = selection
    .append('svg')
      .attr('width', width * ratio + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0)
      .call(responsivefy)
    .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  svg
    .selectAll('circle')
    .data(scores.filter(score => _.find(cutscoreSet.cuts, {test: score.test})))
    .enter()
    .append('circle')
      .attr('r', 10)
      .attr('cx', d => {
        return x(_.find(cutscoreSet.cuts, {test: d.test, year: d.year}).level);
      })
      .attr('cy', d => y(d.score))
      .style('fill', 'red')
      .style('fill-opacity', 0.4);
}
