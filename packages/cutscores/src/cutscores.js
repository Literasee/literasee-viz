import { default as getDataParameters } from './getDataParameters';
import { default as loadData } from './loadData';

import mergeCutsAndScores from './mergeCutsAndScores';
import { responsivefy } from './utils';

var w = 800;
var h = 400;
var margin = { top: 0, right: 0, bottom: 30, left: 0 };
var width = w - margin.left - margin.right;
var height = h - margin.top - margin.bottom;
var interp = d3.interpolateRgb('red', 'blue');
if (window['pym']) var pymChild = new pym.Child();

export default function (selector = 'body', args) {
  const container = d3.select(selector).style('position', 'relative');
  const params = getDataParameters(selector, args);

  loadData(params)
    .then(({stateData, studentData}) => {

      let allCuts = _.flatten(_.map(stateData, 'cuts'));

      if (studentData) {
        const subjectData = studentData.data.subjects[stateData[0].subject];

        stateData.forEach((cutscoreSet, i) => {
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
              .style('position', 'absolute')
              .style(i ? 'right' : 'left', 0)
              .call(drawBackground, cutscoreSet, x, y, ratio);
          } else {
            container
              .call(drawBackground, cutscoreSet, x, y);
          }
        });

        allCuts = mergeCutsAndScores(allCuts, subjectData);
        allCuts = createGutterCuts(allCuts);
        const scores = subjectData.map(d => {
          return _.merge(
            d,
            { level: _.find(allCuts, {test: d.test, year: d.year}).level }
          );
        })
        const { x, y } = createScales(allCuts);

        var layer = container
          .append('div')
            .attr('id', Date.now())
            .style('position', 'relative')
            .style('pointer-events', 'none')

        layer
          .call(drawLines, scores, x, y)
          .call(drawTrajectories, scores, x, y, allCuts)
          .call(drawScores, scores, x, y);

      } else {
        const cutscoreSet = stateData.pop();
        cutscoreSet.cuts = createGutterCuts(cutscoreSet.cuts);
        const { x, y } = createScales(cutscoreSet.cuts);
        container.call(drawBackground, cutscoreSet, x, y, 1, false);
      }

      if (pymChild) pymChild.sendHeight();

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

function drawBackground (selection, data, x, y, ratio = 1, absolute = true) {
  var colors = ['#525252', '#737373', '#969696', '#BDBDBD', '#D9D9D9'];

  var cut_scores = data.cuts;
  var numLevels = data.levels.length;

  // base with margins
  var svg = selection
    .append('svg')
      .style('position', absolute && 'absolute')
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
}

function drawLines (selection, scores, x, y) {
  var svg = selection
    .append('svg')
      .style('position', 'absolute')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .call(responsivefy)
    .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  var line = d3.line()
    .x(d => x(d.level))
    .y(d => y(d.score))
    .curve(d3.curveCatmullRom.alpha(0.5));

  svg
    .selectAll('.line')
    .data(scores)
    .enter()
    .append('path')
      .attr('class', 'line')
      .attr('d', (d, i) => {
        if (i + 1 < scores.length && scores[i + 1].sgp) {
          return line(scores.slice(i, i + 2));
        }
      })
      .style('stroke', d => interp(+d.sgp / 100))
      .style('stroke-width', 3)
      .style('fill', 'none');
}

function drawTrajectories (selection, scores, x, y, cuts) {
  scores.forEach(score => {
    if (!score.trajectories) return;

    var svg = selection
      .append('svg')
        .style('position', 'absolute')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .call(responsivefy)
      .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    var data = score.trajectories.map((t, j) => {
      return [
        _.merge(_.clone(score), { percentile: j + 1 })
      ].concat(t.map((num, i, list) => {
        return {
          level: cuts[cuts.length - 1 - list.length + i].level,
          score: num,
          percentile: j + 1
        }
      }));
    });

    var line = d3.line()
      .x(d => x(d.level))
      .y(d => y(d.score))
      .curve(d3.curveCatmullRom.alpha(0.5));

    svg
      .selectAll('.trajectory')
      .data(data)
      .enter()
      .append('path')
        .attr('id', d => 'test' + score.level + '_trajectory_' + d[0].percentile)
        .attr('class', 'trajectory')
        .attr('d', d => line(d))
        .style('stroke', d => {
          return interp(+d[0].percentile / 100);
        })
        .style('stroke-width', 2)
        .style('stroke-opacity', 0)
        .style('fill', 'none');
  });
}

function drawScores (selection, scores, x, y) {
  var svg = selection
    .append('svg')
      .style('position', 'absolute')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .call(responsivefy)
    .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

  function turnOn (el) {
    d3.select(el)
      .attr('data-is-selected', true)
      .style('stroke-width', 4)
      .style('cursor', 'ns-resize');

    if (d3.select(el).attr('data-trajectory-percentile') === null) {
      d3.select(el).attr('data-trajectory-percentile', 50);
    }
  }

  function turnOff (els) {
    d3.selectAll(els)
      .attr('data-is-selected', false)
      .style('stroke-width', 2)
      .style('cursor', 'default');
  }

  svg
    .selectAll('circle')
    .data(scores)
    .enter()
    .append('circle')
      .attr('r', 10)
      .attr('cx', d => x(d.level))
      .attr('cy', d => y(d.score))
      .style('fill', 'white')
      .style('stroke', '#666')
      .style('stroke-width', 2)
      .style('pointer-events', 'auto') // needed because parent ignores events
      .on('mouseover mouseout', function (d) {
        if (!d.trajectories) return;
        if (d3.select(this).attr('data-is-selected') === 'true') return;

        d3.select(this)
          .style('cursor', d3.event.type === 'mouseover' ? 'pointer' : 'default');
      })
      .on('click', function (d, i, collection) {
        if (!d.trajectories) return;

        var c = d3.select(this);
        var isSelected = c.attr('data-is-selected') !== 'true';

        turnOff(collection);
        d3.selectAll('.trajectory').style('stroke-opacity', 0);

        if (isSelected) {
          turnOn(this);
          var tp = d3.select(this).attr('data-trajectory-percentile');
          d3.select('#test' + d.level + '_trajectory_' + tp).style('stroke-opacity', 1);
        }
      })
      .on('wheel', function (d) {
        var c = d3.select(this);

        if (c.attr('data-is-selected') !== 'true') return;

        d3.event.preventDefault();
        d3.selectAll('.trajectory').style('stroke-opacity', 0);

        var tp = +(c.attr('data-trajectory-percentile'));
        var tpNew = tp + d3.event.deltaY;
        tpNew = Math.min(99, Math.max(1, tpNew));
        c.attr('data-trajectory-percentile', tpNew);
        d3.select('#test' + d.level + '_trajectory_' + tpNew).style('stroke-opacity', 1);
      });

}
