import { parse } from 'query-string';
import { getDataAttributes, camelizeKeys } from './utils';

export default function (selector = 'body', args) {
  const container = d3.select(selector);
  const attrs = getDataAttributes(container);
  const urlVars = camelizeKeys(parse(location.search));

  // get options using the following priority order:
  // 1. args passed in the function call
  // 2. data-* attributes set on target DOM element
  // 3. URL querystring values
  // 4. defaults defined below
  let params = _.defaults(args, attrs, urlVars, {
    state: 'CO',
    minYear: 1900,
    maxYear: 2100,
    subject: null, // default subject is whatever is listed first in the data
    student: null, // student is optional
    showGrowth: false
  });

  // options clean up
  params.state = params.state.toUpperCase();
  params.minYear = parseInt(params.minYear, 10);
  params.maxYear = parseInt(params.maxYear, 10);

  return params;
}
