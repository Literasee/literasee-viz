import { responsivefy } from './utils';

export default function (w, h, margin) {
  return {
    width: w - margin.left - margin.right,
    height: h - margin.top - margin.bottom,
    createSVG: function (selection, position = 'absolute', ratio = 1) {
      const svg = selection
        .append('svg')
          .style('position', position)
          .style('pointer-events', 'none')
          .attr('width', w * ratio + margin.left + margin.right)
          .attr('height', h + margin.top + margin.bottom)
          .call(responsivefy);

      const maskName = 'mask' + Date.now() + Math.random() * 10000;

      svg
        .append('defs')
        .append('clipPath')
          .attr('id', maskName)
          .append('rect')
            .attr('width', w * ratio + margin.left + margin.right)
            .attr('height', h + margin.top + margin.bottom);
        
      return svg.append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`)
          .attr('clip-path', `url(#${maskName})`);
    }
  }
}
