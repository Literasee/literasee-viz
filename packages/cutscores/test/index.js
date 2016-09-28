import test from 'ava';

import { customizeCuts } from '../src/utils';

var standard = require('./fixtures/scores/standard.json');
var standardResults = require('./fixtures/results/CO/standard.json');
var repeat = require('./fixtures/scores/repeat.json');
var repeatResults = require('./fixtures/results/CO/repeat.json');
var missing = require('./fixtures/scores/missing.json');
var missingResults = require('./fixtures/results/CO/missing.json');
var skipped = require('./fixtures/scores/skipped.json');
var skippedResults = require('./fixtures/results/CO/skipped.json');
var missingAndSkipped = require('./fixtures/scores/missing-and-skipped.json');
var missingAndSkippedResults = require('./fixtures/results/CO/missing-and-skipped.json');

var CO = require('./fixtures/states/CO.json');
var CO_MathVertical = CO.data[2];

test('Standard progression CO Mathematics 2008-2014', t => {
  t.is(
    JSON.stringify(customizeCuts(CO_MathVertical.cuts, standard.data.scores)),
    JSON.stringify(standardResults)
  );
});

test('Repeated grade CO Mathematics 2008-2014', t => {
  t.is(
    JSON.stringify(customizeCuts(CO_MathVertical.cuts, repeat.data.scores)),
    JSON.stringify(repeatResults)
  );
});

test('Missing grade CO Mathematics 2008-2014', t => {
  t.is(
    JSON.stringify(customizeCuts(CO_MathVertical.cuts, missing.data.scores)),
    JSON.stringify(missingResults)
  );
});

test('Skipped grade CO Mathematics 2008-2014', t => {
  t.is(
    JSON.stringify(customizeCuts(CO_MathVertical.cuts, skipped.data.scores)),
    JSON.stringify(skippedResults)
  );
});

test('Missing and skipped CO Mathematics 2008-2014', t => {
  t.is(
    JSON.stringify(customizeCuts(CO_MathVertical.cuts, missingAndSkipped.data.scores)),
    JSON.stringify(missingAndSkippedResults)
  );
});
