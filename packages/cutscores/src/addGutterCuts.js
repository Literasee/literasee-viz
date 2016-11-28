export default function (cuts, gutter = 0.5) {
  // to create a "gutter" and prevent our min and max values from being plotted
  // right on the edges of our chart, we need to create some fake data entries
  // we will essentially find the min and max grades and create entries
  // slightly below and above them, respectively
  // 0 to 1, how much of a "grade" should the gutters represent?
  // this function also adds `level` properties to each cut
  // to assure there is a numeric field to use for ordering, etc.

  const n = cuts.length;

  return [].concat(
    _.merge(_.clone(cuts[0]), {level: -gutter, test: null}),
    cuts.map((cut, i) => {
      return _.merge(_.clone(cut), {level: i})
    }),
    _.merge(_.clone(cuts[n - 1]), {level: n - gutter, test: null})
  );
}
