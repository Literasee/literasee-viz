import { responsivefy } from './utils';

// this file encapsulates use of the D3 margin convention
// createSVG was initially used extensively in cutscores.js
// but isn't anymore due to a refactor
// as a result, this file could probably be merged into cutscores.js
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
