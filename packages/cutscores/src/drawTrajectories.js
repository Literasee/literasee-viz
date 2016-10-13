export default function (selection, scores, x, y, colors) {
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

    selection
      .selectAll('.trajectory' + score.level)
      .data(data)
      .enter()
      .append('path')
        .attr('id', d => 'test' + score.level + '_trajectory_' + d[0].percentile)
        .attr('class', 'trajectory trajectory' + score.level)
        .attr('d', d => line(d))
        .style('stroke', d => {
          return colors(+d[0].percentile / 100);
        })
        .style('stroke-width', 2)
        .style('stroke-opacity', 0)
        .style('fill', 'none');
  });
}
