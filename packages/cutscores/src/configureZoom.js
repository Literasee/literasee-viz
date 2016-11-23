export default function (container, w, h, margin) {
  function zoomed() {
    const tooltip = d3.select('.tooltip');
    if (tooltip.size() && tooltip.style('visibility') === 'visible') return;

    const { x, y, k } = d3.event.transform;
    const svg = d3.select('.zoom-target');
    const w = svg.attr('width');
    const cw = w * k;
    const h = svg.attr('height');
    const ch = h * k;

    // we have to calculate how much everything has been scaled by the viewBox
    // because it affects how we calculate the proper translation amounts
    const vbRatio = svg.attr('height') / svg.attr('viewBox').split(' ').pop();

    // Math.min(0, ...) prevents panning things too far right
    // (w - cw) and (h - cw) give us the amount the width and height
    // have grown based on the event's scale property (k)
    // those values have to be divided by the viewBox scaling
    // to get accurate values, because the viewBox scaling has already been applied
    // the Math.max() comparison prevents things from being panned too far left
    const tx = Math.min(0, Math.max(x, (w - cw) / vbRatio));
    const ty = Math.min(0, Math.max(y, (h - ch) / vbRatio));

    // d3.event.transform is somewhat persistent, so we have to overwrite
    // its values to ensure they match what we've calculated
    // otherwise, dragging after our code has limited the panning
    // will keep growing the values, resulting in having to 
    // "pan back" even though nothing is moving
    d3.event.transform.x = tx;
    d3.event.transform.y = ty;

    // construct our custom transform string
    const trans = `translate(${tx},${ty}) scale(${k})`;

    // some of the zoom targets are different
    // if the chart has an assessment change (split)
    if (d3.select('.cutsContainer').size()) {
      d3.select('.cutsContainer').attr('transform', trans);
      d3.select('.growthCutsContainer').attr('transform', trans);
      d3.select('.axes').attr('transform', `translate(${tx},0) scale(${k})`);
    } else {
      d3.selectAll('.cuts').attr('transform', trans);
      d3.selectAll('.growth_cuts').attr('transform', trans);
      // we want the axis to remain pinned to the bottom
      d3.selectAll('.x-axis').attr('transform', `translate(${tx},0) scale(${k})`);
    }

    d3.select('.lines').attr('transform', trans);
    d3.select('.trajectories').attr('transform', trans);
    d3.select('.scores').attr('transform', trans);
  }

  // basic zoom that prevents zooming out beyond initial size
  // and zooming in more than 3X
  const zoom = d3.zoom()
    .scaleExtent([1, 3])
    .on('zoom', zoomed);

  // attach zoom handler to root svg
  container.select('svg').classed('zoom-target', true).call(zoom);

  // add button for clearing zoom transforms
  d3.select('#uiContainer')
    .append('button')
    .text('Reset Zoom')
    .on('click', function () {
      d3.select('.zoom-target')
        .transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    });
}