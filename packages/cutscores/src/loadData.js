function fetchJSON (url) {
  return fetch(url).then(d => d.json());
}

function filterBySubjectAndYearBounds (subject, minYear, maxYear, stateData) {
  return _
    .chain(stateData.data)
    .tap(function (arr) {
      if (!subject) subject = arr[0].subject;
    })
    .filter(function (o) {
      return o.subject === subject;
    })
    .filter(function (o) {
      // if either param falls within the bounds of a set of cuts
      if (minYear >= o.minYear && minYear <= o.maxYear) return true;
      if (maxYear >= o.minYear && maxYear <= o.maxYear) return true;

      if (minYear < o.minYear && maxYear >= o.minYear) return true;
      if (maxYear > o.maxYear && minYear <= o.maxYear) return true;
    })
    .sortBy('maxYear')
    .value();
}

export default function ({state, student, subject, minYear, maxYear}) {
  const base = window.location.hostname === 'localhost'
    ? 'http://localhost:4000'
    : 'https://literasee.github.io/cutscores';

  const filter = filterBySubjectAndYearBounds.bind(
    null,
    subject,
    minYear,
    maxYear
  );

  // if there is no student specified
  // just load the state data and
  // get the most recent cutscore set for the specified subject
  if (!student) {
    return fetchJSON(`${base}/sgp/${state}.json`)
      .then(data => {
        return {
          stateData: filter(data).slice(-1)
        };
      });
  }

  // if a student was specified
  // the state data loaded depends on the student data
  let studentData;

  return fetchJSON(`${base}/students/${student}.json`)
    .then(data => {
      studentData = data;

      return fetchJSON(`${base}/sgp/${data.metadata.split || data.data.state}.json`);
    })
    .then(data => {
      const stateData = filter(data);

      // if student data crosses an assessment change, return all cutscore sets
      // otherwise, only return latest
      return {
        stateData: studentData.metadata.split ? stateData : stateData.slice(-1),
        studentData
      };
    });
}
