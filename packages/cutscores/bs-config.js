module.exports = {
  server: '.',
  files: [
    '*.html',
    'build/*'
  ],
  ui: false,
  notify: false,
  ghostMode: false,
  open: false,
  rewriteRules: [
    {
      match: 'https://data.literasee.io',
      replace: 'http://localhost:4000'
    }
  ]
};
