import { default as getDataParameters } from './getDataParameters';
import { default as loadData } from './loadData';

import mergeCutsAndScores from './mergeCutsAndScores';

window.dashes = {
  color: 'white',
  width: 2,
  opacity: 0.5,
  dasharray: [3, 20],
  dashoffset: 1000,
  duration: 30000
}

import chartInit from './chartInit';
import addGutterCuts from './addGutterCuts';
import createCutScales from './createCutScales';
import drawBackground from './drawBackground';
import drawGrowthLines from './drawGrowthLines';
import drawTrajectories from './drawTrajectories';
import drawScores from './drawScores';

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

  loadData(params)
    .then(({stateData, studentData}) => {

      // if just rendering cuts draw the background and bail
      if (!studentData) {
        const cutscoreSet = stateData.pop(); // grab the most recent cuts
        cutscoreSet.cuts = addGutterCuts(cutscoreSet.cuts);
        const { x, y } = createCutScales(cutscoreSet.cuts, width, height);
        // if the cuts are the only thing we're rendering
        // their svg tag needs to be relatively positioned
        // to ensure the chart is included in the page layout
        createSVG(container, 'relative')
          .call(drawBackground, cutscoreSet, x, y, height);
        return;
      }

      let allCuts = _.flatten(_.map(stateData, 'cuts'));

      const subjectData = studentData.data.subjects[stateData[0].subject];

      stateData.forEach((cutscoreSet, i) => {
        // get the ratio before modifying the cuts
        var ratio = cutscoreSet.cuts.length / allCuts.length;

        // merging with student data has to be first because
        // it can remove (skipped) or duplicate (repeated) tests
        cutscoreSet.cuts = mergeCutsAndScores(cutscoreSet.cuts, subjectData);
        // create level props and dummy tests at beginning and end of list
        cutscoreSet.cuts = addGutterCuts(cutscoreSet.cuts);
        // create scales using fully transformed list of cuts/tests
        const { x, y } = createCutScales(cutscoreSet.cuts, width, height);

        if (ratio < 1) {
          x.range([0, w * ratio - margin.left - margin.right]);

          const splitWrapper = container
            .append('div')
            .attr('id', Date.now())
            .style('width', ratio * 100 + '%')
            .style('display', 'inline-block')
            .style('position', 'absolute')
            .style(i ? 'right' : 'left', 0);

          createSVG(splitWrapper, 'absolute', ratio)
            .call(drawBackground, cutscoreSet, x, y, height);
        } else {
          createSVG(container).call(drawBackground, cutscoreSet, x, y, height);
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

      var layer = container
        .append('div')
          .attr('id', Date.now())
          .style('position', 'relative')
          .style('pointer-events', 'none');

      // create a new, absolutely positioned SVG to house the growth lines
      createSVG(layer).call(drawGrowthLines, scores, x, y);
      // create a new, absolutely positioned SVG to house the trajectory lines
      const trajectories = createSVG(layer).call(drawTrajectories, scores, x, y);
      // create a new, absolutely positioned SVG to house the score bubbles
      createSVG(layer)
        .call(drawScores, scores, x, y)
        .on('scoreSelected trajectoryChanged', () => {
          trajectories[d3.event.type](d3.event.detail);
        })

    })
    .then(() => {
      if (window['pym']) new pym.Child().sendHeight();
    });
}
