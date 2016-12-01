import colorScale from './colorScale';

const dashesConfig = {
  color: 'white',
  width: 2,
  opacity: 0.5,
  dasharray: [3, 20],
  dashoffset: 1000,
  duration: 30000
}

function animateDashes (sel) {
  sel
    .attr('stroke-dashoffset', dashesConfig.dashoffset)
    .attr('stroke-opacity', dashesConfig.opacity)
    .transition()
      .duration(dashesConfig.duration)
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

  const g = svg
    .append('g')
    .attr('class', 'trajectories');

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

    // create a group for all trajectory lines by default but hide them
    const groups = g
      .selectAll('.trajectory' + score.level)
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'trajectory')
      .attr('id', d => 'test' + score.level + '_trajectory_' + d[0].percentile)
      .style('opacity', 0);

    // create the actual lines
    groups
      .append('path')
      .attr('class', 'trajectory' + score.level)
      .attr('d', d => line(d))
      .style('stroke', d => {
        return colorScale(+d[0].percentile / 100);
      })
      .style('stroke-width', 2)
      .style('fill', 'none');

    // if present, create target score bubbles (catch up, keep up, etc)
    if (score.targets) {
      const targets = _.map(score.targets, 'percentile');
      const trajScores = groups.selectAll('.trajectory-score')
        .data(d => d)
        .enter()
          .filter((d, i) => {
            const target = _.find(score.targets, {percentile: d.percentile});
            // when i is 0 we're not examining a future score
            if (!i || !target) return false;

            // limit the number of targets shown
            const limit = target.timeFrame || 3;
            return i <= limit;
          })
          .append('g')
          .attr('class', 'trajectoryTarget')
          .attr('transform', d => {
            return `translate(${x(d.level)}, ${y(d.score)})`;
          });

      trajScores
        .append('rect')
        .attr('x', -20)
        .attr('y', -10);

      trajScores
        .append('text')
        .attr('y', 4)
        .text(d => d.score);
    }

    var midpointLevel;
    var midpointScore;

    // create trajectory line labels
    const trajectoryLabel = groups
      .append('text')
      .each(d => {
        const half = d.length / 2;
        let middleItems;
        // even number of items
        if (half === parseInt(half, 10)) {
          middleItems = [d[half - 1], d[half]];
        } else {
          // odd number of items
          middleItems = [d[Math.floor(half)], d[Math.floor(half)]];
        }
        midpointLevel = (middleItems[0].level + middleItems[1].level) / 2;
        midpointScore = (middleItems[0].score + middleItems[1].score) / 2;
      })
      .attr('x', d => x(midpointLevel))
      .attr('y', d => y(d[d.length - 1].score) + 45)
      .attr('class', 'trajectoryPercentile');

    trajectoryLabel
      .append('tspan')
      .style('text-anchor', 'middle')
      .attr('x', x(midpointLevel))
      .text(d => {
        const pct = d[0].percentile;
        let suffix = 'th';

        switch (pct.toString().substr(-1)) {
          case '1':
            suffix = 'st';
            break;
          case '2':
            suffix = 'nd';
            break;
          case '3':
            suffix = 'rd';
            break;
        }

        return pct + suffix + ' percentile';
      });

    // add target label
    if (score.targets) {
      trajectoryLabel
        .append('tspan')
        .style('text-anchor', 'middle')
        .attr('x', x(midpointLevel))
        .attr('dy', '1.2em')
        .text(d => {
          const pct = d[0].percentile;
          const target = _.find(score.targets, {percentile: pct});
          return target && target.label;
        })
    }
  });

  g
    .append('path')
    .attr('id', 'trajectory-highlight')
    .attr('fill', 'none')
    .attr('stroke', dashesConfig.color)
    .attr('stroke-width', dashesConfig.width)
    .attr('stroke-opacity', dashesConfig.opacity)
    .attr('stroke-dasharray', dashesConfig.dasharray);

  svg.scoreSelected = function ({el, d}) {
    // we only care if we need to turn things off
    if (el) return;

    g.selectAll('.trajectory').style('opacity', 0);
    g.select('#trajectory-highlight').interrupt().attr('stroke-opacity', 0);
  }

  // when the trajectory changes turn all of them invisible
  // and then turn on the appropriate new one
  svg.trajectoryChanged = function ({d, pct}) {
    d3.selectAll('.trajectory')
      .style('opacity', 0);

    d3.select('#test' + d.level + '_trajectory_' + pct)
      .style('opacity', 1);

    const traj = d3.select('#test' + d.level + '_trajectory_' + pct);

    g
      .select('#trajectory-highlight')
      .attr('d', traj.select('path').attr('d'))
      .call(animateDashes);
  }
}
