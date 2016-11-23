export default function (svg, data, x, y, height, isGrowth) {
  var cut_scores = isGrowth ? data.cuts_growth : data.cuts;
  var levels = isGrowth ? data.levels_growth : data.levels;
  var numLevels = levels.length;

  const opacityScale = d3.scaleLinear()
    .domain([0, numLevels - 1])
    .range([0.25, 0.05]);
  const growthColorScale = d3.scaleQuantize()
    .domain([0, numLevels - 1])
    .range(['#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#abd9e9']);

  const g = svg
    .append('g')
    .classed('cuts', true)
    .classed('growth_cuts', isGrowth);

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

  var bands = g
    .selectAll('.layer')
    .data(stack(cut_scores))
    .enter()
      .append('g')
      .attr('class', 'layer')
      .style('pointer-events', 'auto')
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
    .style('fill', (d, i) => {
      if (!isGrowth) return '#333';
      return growthColorScale(i);
    })
    .style('fill-opacity', (d, i) => {
      if (!isGrowth) return opacityScale(i);
      return 0.6;
    })
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
    .text((d, i) => levels[i].label);

  // next line only needed if chart will be updated
  // bands.attr('d', area);
}
