import { responsivefy } from './utils';

export default function (w, h, margin) {
  return {
    width: w - margin.left - margin.right,
    height: h - margin.top - margin.bottom,
    createSVG: function (selection, position = 'absolute', ratio = 1) {
      return selection
        .append('svg')
          .style('position', position)
          .style('pointer-events', 'none')
          .attr('width', w * ratio + margin.left + margin.right)
          .attr('height', h + margin.top + margin.bottom)
          .call(responsivefy)
        .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`);
    }
  }
}
