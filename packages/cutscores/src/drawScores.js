export default function (svg, scores, x, y) {
  function turnOn (el, d) {
    const c = d3.select(el);

    // style the score bubble
    c.attr('data-is-selected', true)
      .style('stroke-width', 4)
      .style('cursor', 'ns-resize');

    // scroll and drag listener
    function changeTrajectory () {
      if (d3.event.type === 'wheel') d3.event.preventDefault();

      const delta = d3.event.type === 'wheel' ? d3.event.deltaY : Math.round(-d3.event.dy);
      const pct = +c.attr('data-trajectory-percentile');
      const newPct = Math.min(99, Math.max(1, pct + delta));

      if (newPct !== pct) {
        c.attr('data-trajectory-percentile', newPct);
        svg.dispatch('trajectoryChanged', {detail: {el, d, pct: newPct}});
      }
    }

    // listen for scroll and drag events on the selected bubble
    c.on('wheel', changeTrajectory);
    c.call(d3.drag().on('drag', changeTrajectory));

    // dispatch events
    svg.dispatch('scoreSelected', {detail: {el, d}});
    svg.dispatch('trajectoryChanged', {
      detail: {
        el,
        d,
        pct: +c.attr('data-trajectory-percentile')
      }
    });
  }

  function turnOff (els) {
    // reset bubble style and remove listeners
    d3.selectAll(els)
      .attr('data-is-selected', false)
      .style('stroke-width', 2)
      .style('cursor', 'default')
      .on('wheel', null)
      .on('.drag', null);

    svg.dispatch('scoreSelected', {detail: {el: null, d: null}});
  }

  var tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('z-index', '10')
    .style('visibility', 'hidden')
    .style('background-color', 'lightgreen')
    .style('border-radius', '4px')
    .style('border', '1px solid black')
    .style('padding', '1rem')
    .style('font-size', 11)
    .style('font-family', 'sans-serif');

  svg
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
        if (d3.event.type === 'mouseover') {
          tooltip
            .text(d.score)
            .style('visibility', 'visible');
        } else {
          tooltip.style('visibility', 'hidden');
        }

        if (!d.trajectories) return;
        if (d3.select(this).attr('data-is-selected') === 'true') return;

        d3.select(this)
          .style('cursor', d3.event.type === 'mouseover' ? 'pointer' : 'default');
      })
      .on('mousemove', function (d) {
        tooltip
          .style('top', d3.event.pageY - 10 + 'px')
          .style('left', d3.event.pageX + 10 + 'px');
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
