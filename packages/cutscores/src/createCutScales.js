export default function (cuts, width, height) {
  return {
    x: d3.scaleLinear()
         .domain(d3.extent(_.map(cuts, 'level')))
         .range([0, width]),
    y: d3.scaleLinear()
         .domain([
           d3.min(cuts, d => d.loss),
           d3.max(cuts, d => d.hoss)
         ])
         .range([height, 0])
  };
}
