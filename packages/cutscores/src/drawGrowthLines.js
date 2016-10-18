import colorScale from './colorScale';

export default function (svg, scores, x, y) {
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
      .style('stroke', d => colorScale(+d.sgp / 100))
      .style('stroke-width', 3)
      .style('fill', 'none');
}
