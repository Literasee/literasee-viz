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
  var s = [].concat(scores);

  cuts.forEach(cut => {
    if (s[0] && s[0].test === cut.test) {
      result.push(_.clone(_.merge(cut, s.shift())));
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

export function customizeCuts (cuts, scores) {
  var cutsWithRepeats = createCutRepeats(cuts, scores);
  var results = mergeScores(cutsWithRepeats, scores);
  return removeSkippedYears(results, scores);
}
