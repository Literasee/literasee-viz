import getDataParameters from './getDataParameters';
import loadData from './loadData';
import mergeCutsAndScores from './mergeCutsAndScores';

import chartInit from './chartInit';
import addGutterCuts from './addGutterCuts';
import createCutScales from './createCutScales';
import drawBackground from './drawBackground';
import drawGrowthLines from './drawGrowthLines';
import drawTrajectories from './drawTrajectories';
import drawScores from './drawScores';
import drawAxis from './drawAxis';
import configureZoom from './configureZoom';

// these dimensions will only control aspect ratio since charts are responsive
const w = 800;
const h = 400;
const margin = { top: 0, right: 0, bottom: 30, left: 0 };

const {
  width,
  height,
  createSVG
} = chartInit(w, h, margin);

export default function (selector = 'body', args) {
  const container = d3.select(selector).style('position', 'relative');
  const params = getDataParameters(selector, args);
  // one SVG holds all the layers, implemented inside their own g elements
  const g = createSVG(container);

  loadData(params)
    .then(({stateData, studentData}) => {
      if (!studentData) {
        const cutscoreSet = stateData.pop(); // grab the most recent cuts
        cutscoreSet.cuts = addGutterCuts(cutscoreSet.cuts);
        cutscoreSet.cuts_growth = addGutterCuts(cutscoreSet.cuts_growth);
        const { x, y } = createCutScales(cutscoreSet.cuts, width, height);
        // draw normal cutscores layer
        g.call(drawBackground, cutscoreSet, x, y, height);
        // draw growth cutscores layer if requested
        if (params.showGrowth) {
          g.call(drawBackground, cutscoreSet, x, y, height, true);
        }
        // draw axis on its own layer so it can mask during zoom
        g.call(drawAxis, cutscoreSet, x, y, width, height, margin);
      }

      return {stateData, studentData};
    })
    .then(({stateData, studentData}) => {
      if (!studentData) return;

      let allCuts = _.flatten(_.map(stateData, 'cuts'));
      const subjectData = studentData.data.subjects[stateData[0].subject];
      let cutsContainer;
      let growthCutsContainer;
      let axisContainer;

      stateData.forEach((cutscoreSet, i) => {
        // get the ratio before modifying the cuts
        var ratio = cutscoreSet.cuts.length / allCuts.length;

        // merging with student data has to be first because
        // it can remove (skipped) or duplicate (repeated) tests
        cutscoreSet.cuts = mergeCutsAndScores(cutscoreSet.cuts, subjectData);
        cutscoreSet.cuts_growth = mergeCutsAndScores(cutscoreSet.cuts_growth, subjectData);
        // create level props and dummy tests at beginning and end of list
        cutscoreSet.cuts = addGutterCuts(cutscoreSet.cuts);
        cutscoreSet.cuts_growth = addGutterCuts(cutscoreSet.cuts_growth);
        // create scales using fully transformed list of cuts/tests
        const { x, y } = createCutScales(cutscoreSet.cuts, width, height);

        if (ratio < 1) {
          x.range([0, w * ratio - margin.left - margin.right]);

          // draw normal cutscores layer
          if (!cutsContainer) cutsContainer = g.append('g').attr('class', 'cutsContainer');
          cutsContainer.call(drawBackground, cutscoreSet, x, y, height);

          // draw growth cutscores layer if requested
          if (params.showGrowth) {
            if (!growthCutsContainer) {
              growthCutsContainer = g.append('g').attr('class', 'growthCutsContainer');
            }
            growthCutsContainer.call(drawBackground, cutscoreSet, x, y, height, true);
          }

          // draw axis on its own layer so it can mask during zoom
          if (!axisContainer) {
            axisContainer = g.append('g')
              .attr('class', 'axes')
              .attr('transform', `translate(0, ${height})`);
          }
          axisContainer.call(drawAxis, cutscoreSet, x, y, width, height, margin, ratio);

          // if there was an assessment change (split)
          // we have to position the cuts and axis 
          // that go on the right side
          if (i > 0) {
            const trans = `translate(${width * (1 - ratio)}, 0)`;

            cutsContainer
              .select('.cuts:last-child')
              .attr('transform', trans);
            
            if (params.showGrowth) {
              growthCutsContainer
                .select('.cuts:last-child')
                .attr('transform', trans);
            }

            g.selectAll('.axis')
              .attr('transform', (d, j) => j ? trans : null);
          }
            
        } else {
          // draw normal cutscores layer
          g.call(drawBackground, cutscoreSet, x, y, height);
          // draw growth cutscores layer if requested
          if (params.showGrowth) {
            g.call(drawBackground, cutscoreSet, x, y, height, true);
          }
          // draw axis on its own layer so it can mask during zoom
          g.call(drawAxis, cutscoreSet, x, y, width, height, margin);
        }
      });

      allCuts = mergeCutsAndScores(allCuts, subjectData);
      allCuts = addGutterCuts(allCuts);
      const scores = subjectData.map(d => {
        return _.merge(
          d,
          { level: _.find(allCuts, {test: d.test, year: d.year}).level }
        );
      })
      const { x, y } = createCutScales(allCuts, width, height);

      // draw the growth lines on their own layer
      g.call(drawGrowthLines, scores, x, y);
      // draw the trajectory lines on their own layer
      const trajectories = g.call(drawTrajectories, scores, x, y);
      // draw the score bubbles on their own layer
      g.call(drawScores, scores, x, y)
        .on('scoreSelected trajectoryChanged', () => {
          trajectories[d3.event.type](d3.event.detail);
        });

    })
    .then(() => {
      // move the axes to the highest layer in the SVG
      // so they can mask the other layers when zooming
      d3.selectAll('.axis, .axes').raise();
      // create zoom handling
      configureZoom(container, w, h, height);
    })
    .then(() => {
      if (window['pym']) {
        window.pymChild = new pym.Child();
        window.pymChild.sendHeight();
      }
      if (params.showGrowth) {
        // add button for toggling growth cuts layer
        d3.select('#uiContainer')
          .append('button')
          .text('Hide Growth Cuts')
          .on('click', function () {
            var isHidden = d3
              .select('.growth_cuts')
              .style('display') === 'none';

            d3.select(this)
              .text(isHidden ? 'Hide Growth Cuts' : 'Show Growth Cuts');

            d3.selectAll('.growth_cuts')
              .style('display', isHidden ? 'block' : 'none');
          });
      }
    });
}
