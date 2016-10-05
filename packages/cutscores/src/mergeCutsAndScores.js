import { default as _ } from 'lodash';

function createCutRepeats (cuts, scores) {
  var scoreTests = _.map(scores, 'test');
  var scoreTestsUnique = _.uniq(scoreTests);

  // no repeats
  if (scoreTests.length === scoreTestsUnique.length) return _.cloneDeep(cuts);

  var result = [];
  cuts.forEach((cut, i) => {
    var matches = _.filter(scores, {test: cut.test});
    if (!matches.length) {
      result.push(_.clone(cut));
    } else {
      for (var j = 0; j < matches.length; j++) {
        result.push(_.clone(cut));
      }
    }
  })
  return result;
}

function mergeScores (cuts, scores) {
  var result = [];

  cuts.forEach(cut => {
    var match = _.find(scores, {test: cut.test});

    if (match) {
      result.push(_.merge(_.clone(cut), _.clone(match)));
    } else {
      result.push(_.clone(cut));
    }
  })

  return result;
}

function removeSkippedYears (cuts, scores) {
  var years = _.compact(_.map(scores, 'year'));
  var matches = [];
  years.forEach(year => {
    var match = _.find(cuts, {year});
    if (match) matches.push({year, index: cuts.indexOf(match)});
  })

  var result = _.cloneDeep(cuts);

  for (var i = matches.length - 1; i > -1; i--) {
    var a = matches[i];
    var b = matches[i-1];

    if (b && b.year + 1 === a.year && b.index + 1 < a.index) {
      result = [].concat(
        result.slice(0, b.index + 1),
        result.slice(a.index)
      )
    }
  }

  return result;
}

function addYears (cuts) {
  var min = cuts.reduce((acc, cut, i) => {
    if (!_.isEmpty(acc)) return acc;
    if (cut.year) return {index: i, year: cut.year};
  }, {});

  var max = cuts.reduce((acc, cut, i) => {
    if (cut.year) return {index: i, year: cut.year};
    return acc;
  }, {});

  return cuts.map((cut, i, arr) => {
    if (i < min.index) return _.merge(_.clone(cut), {year: min.year - (min.index - i)});
    if (i > max.index) return _.merge(_.clone(cut), {year: max.year + (i - max.index)});
    if (cut.year) return _.clone(cut);
    // missing in the middle
    var j = i - 1;
    while (!arr[j].year) {
      j--;
    }
    return _.merge(_.clone(cut), {year: arr[j].year + (i - j)});
  });
}

export default function (cuts, scores) {
  var cutsWithRepeats = createCutRepeats(cuts, scores);
  var results = mergeScores(cutsWithRepeats, scores);
  results = removeSkippedYears(results, scores);
  results = addYears(results);
  return results;
}
