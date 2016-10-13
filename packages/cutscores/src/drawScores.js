export default function (selection, scores, x, y) {
  function displayTrajectory (d) {
    var c = d3.select(this);

    if (d3.event.type === 'wheel') d3.event.preventDefault();

    d3.selectAll('.trajectory').style('stroke-opacity', 0);

    var tp = +(c.attr('data-trajectory-percentile'));
    var tpNew = tp + (d3.event.type === 'wheel' ? d3.event.deltaY : Math.round(-d3.event.dy));
    tpNew = Math.min(99, Math.max(1, tpNew));
    c.attr('data-trajectory-percentile', tpNew);
    d3.select('#test' + d.level + '_trajectory_' + tpNew).style('stroke-opacity', 1);
  }

  function turnOn (el, d) {
    var c = d3.select(el);

    c.attr('data-is-selected', true)
      .style('stroke-width', 4)
      .style('cursor', 'ns-resize');

    var tp = c.attr('data-trajectory-percentile');
    d3.select('#test' + d.level + '_trajectory_' + tp).style('stroke-opacity', 1);

    c.on('wheel', displayTrajectory);
    c.call(d3.drag().on('drag', displayTrajectory));
  }

  function turnOff (els) {
    d3.selectAll('.trajectory').style('stroke-opacity', 0);
    d3.selectAll(els)
      .attr('data-is-selected', false)
      .style('stroke-width', 2)
      .style('cursor', 'default')
      .on('wheel', null)
      .on('.drag', null);
  }

  selection
    .selectAll('circle')
    .data(scores)
    .enter()
    .append('circle')
      .attr('r', 10)
      .attr('cx', d => x(d.level))
      .attr('cy', d => y(d.score))
      .attr('data-trajectory-percentile', 50)
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
        var doSelect = d3.select(this).attr('data-is-selected') !== 'true';

        // unselect all circles
        turnOff(collection);

        // if the clicked circle wasn't already selected, select it
        if (doSelect) {
          turnOn(this, d);
        }
      });
}
