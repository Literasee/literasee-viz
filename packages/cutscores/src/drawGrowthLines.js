export default function (selection, scores, x, y, colors) {
  var line = d3.line()
    .x(d => x(d.level))
    .y(d => y(d.score))
    .curve(d3.curveCatmullRom.alpha(0.5));

  selection
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
      .style('stroke', d => colors(+d.sgp / 100))
      .style('stroke-width', 3)
      .style('fill', 'none');
}
