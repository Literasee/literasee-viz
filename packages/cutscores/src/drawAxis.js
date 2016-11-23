export default function (svg, data, x, y, width, height, margin, ratio = 1) {
  const cut_scores = data.cuts;

  const g = svg
    .append('g')
    .classed('axis', true);

  if (ratio === 1) g.attr('transform', `translate(0, ${height})`)

  // create an X axis using the original length of cut_scores as number of ticks
  var xAxis = d3.axisBottom(x)
    .ticks(cut_scores.length - 2)
    .tickFormat((d, i) => {
      // use the test field for tick labels
      // +1 skips the fake data point we created at the front of the array
      var realCut = cut_scores[i + 1];
      if (realCut.year) return `${realCut.test} / ${realCut.year}`;
      return `${realCut.test}`;
    })
    .tickSizeOuter(0);

  g.append('g')
    .attr('class', 'x-axis')
    .append('rect')
    .attr('width', width * ratio)
    .attr('height', margin.bottom * 2)
    .style('fill', 'white')

  g.append('g')
    .attr('class', 'x-axis')
    .call(xAxis)
    .selectAll('.domain')
    .style('stroke', 'white');

  // Y axes, for debugging only
  // g.append('g').call(d3.axisLeft(y));
  // g.append('g').attr('transform', `translate(${width}, 0)`).call(d3.axisRight(y));
}