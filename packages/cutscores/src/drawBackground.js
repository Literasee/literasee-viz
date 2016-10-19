export default function (svg, data, x, y, height) {
  var cut_scores = data.cuts;
  var numLevels = data.levels.length;
  const opacityScale = d3.scaleLinear()
    .domain([0, numLevels - 1])
    .range([0.25, 0.05]);

  // create an X axis using the original length of cut_scores as number of ticks
  var xAxis = d3.axisBottom(x)
    .ticks(cut_scores.length - 2)
    .tickFormat((d, i) => {
      // use the test field for tick labels
      // +1 skips the fake data point we created at the front of the array
      var realCut = cut_scores[i+1];
      if (realCut.year) return `${realCut.test} / ${realCut.year}`;
      return `${realCut.test}`;
    })
    .tickSizeOuter(0);

  // draw X axis below chart
  svg
    .append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)
    .selectAll('.domain')
    .style('stroke', 'white');

  // Y axes, for debugging only
  // svg.append('g').call(d3.axisLeft(y));
  // svg.append('g').attr('transform', `translate(${width}, 0)`).call(d3.axisRight(y));


  // generate keys from data
  var keys = ['hoss'];
  for (var i = numLevels - 1; i > 0; i--) {
    keys.unshift('cut' + i);
  }

  // generate state by calculating diffs between cuts
  var stack = d3.stack()
    .keys(keys)
    .offset((series, order) => {
      for (var i = series.length - 1; i > -1; i--) {
        for (var j = 0; j < series[i].length; j++) {
          // bottom band runs from loss to cut1
          // others run from prev cut
          if (i === 0) {
            series[i][j][0] = y.domain()[0];
          } else {
            series[i][j][0] = series[i - 1][j][1];
          }

          // top band runs from last cut to hoss to fill chart area
          if (i === series.length - 1) series[i][j][1] = y.domain()[1];
        }
      }
    });

  var area = d3.area()
    .x(d => x(d.data.level))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveCatmullRom.alpha(0.5));

  var bands = svg
    .selectAll('.layer')
    .data(stack(cut_scores))
    .enter()
      .append('g')
      .attr('class', 'layer')
      .on('mouseover', function () {
        d3.select(this)
          .select('path')
          .style('stroke-width', 3);

        d3.select(this)
          .select('text')
          .style('fill-opacity', 1);
      })
      .on('mouseout', function () {
        d3.select(this)
          .select('path')
          .style('stroke-width', 1);

        d3.select(this)
          .select('text')
          .style('fill-opacity', 0);
      });

  // next line only needed if chart will be updated
  // bands.exit().remove();

  // chart is (currently) only rendered once, so everything happens in enter
  bands
    .append('path')
    .style('fill', '#333')
    .style('fill-opacity', (d, i) => opacityScale(i))
    .style('stroke', 'white')
    .style('stroke-width', 1)
    .attr('d', area);

  bands
    .append('text')
    .attr('font-size', 11)
    .attr('font-family', 'sans-serif')
    .attr('x', 5)
    .attr('y', (d, i) => {
      var datum = d[0];
      // datum[0] is the bottom value, datum[1] the top
      var mid = datum[0] + ((datum[1] - datum[0]) / 2);
      return y(mid);
    })
    .attr('dy', '0.4em')
    .style('fill-opacity', 0)
    .text((d, i) => data.levels[i].label);

  // next line only needed if chart will be updated
  // bands.attr('d', area);
}
