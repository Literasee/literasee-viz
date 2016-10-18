import colorScale from './colorScale';

function animateDashes (sel) {
  sel
    .attr('stroke-dashoffset', window.dashes.dashoffset)
    .attr('stroke-opacity', window.dashes.opacity)
    .transition()
      .duration(window.dashes.duration)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0)
      .on('end', function () {
        animateDashes(sel);
      })
}

export default function (svg, scores, x, y) {
  const line = d3.line()
    .x(d => x(d.level))
    .y(d => y(d.score))
    .curve(d3.curveCatmullRom.alpha(0.5));

  scores.forEach(score => {
    if (!score.trajectories) return;

    const data = score.trajectories.map((t, j) => {
      return [
        _.merge(_.clone(score), { percentile: j + 1 })
      ].concat(t.map((num, i, list) => {
        return {
          level: score.level + i + 1,
          score: num,
          percentile: j + 1
        }
      }));
    });

    svg
      .selectAll('.trajectory' + score.level)
      .data(data)
      .enter()
      .append('path')
        .attr('id', d => 'test' + score.level + '_trajectory_' + d[0].percentile)
        .attr('class', 'trajectory trajectory' + score.level)
        .attr('d', d => line(d))
        .style('stroke', d => {
          return colorScale(+d[0].percentile / 100);
        })
        .style('stroke-width', 2)
        .style('stroke-opacity', 0)
        .style('fill', 'none');
  });

  svg
    .append('path')
    .attr('id', 'trajectory-highlight')
    .attr('fill', 'none')
    .attr('stroke', window.dashes.color)
    .attr('stroke-width', window.dashes.width)
    .attr('stroke-opacity', window.dashes.opacity)
    .attr('stroke-dasharray', window.dashes.dasharray);

  svg.scoreSelected = function ({el, d}) {
    // we only care if we need to turn things off
    if (el) return;

    svg.selectAll('.trajectory').style('stroke-opacity', 0);
    svg.select('#trajectory-highlight').interrupt().attr('stroke-opacity', 0);
  }

  svg.trajectoryChanged = function ({el, d, pct}) {
    d3.selectAll('.trajectory').style('stroke-opacity', 0);

    var activeLine = d3.select('#test' + d.level + '_trajectory_' + pct);
    activeLine.style('stroke-opacity', 1);

    // only d actually needs to be set here, the rest are only for live editing
    svg
      .select('#trajectory-highlight')
      .attr('d', activeLine.attr('d'))
      .attr('stroke', window.dashes.color)
      .attr('stroke-width', window.dashes.width)
      .attr('stroke-opacity', window.dashes.opacity)
      .attr('stroke-dasharray', window.dashes.dasharray)
      .call(animateDashes);
  }
}
