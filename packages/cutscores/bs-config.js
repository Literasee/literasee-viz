module.exports = {
  server: '.',
  files: [
    '*.html',
    'build/*'
  ],
  ui: false,
  notify: false,
  ghostMode: false,
  open: 'external',
  host: 'local.literasee.io',
  port: 3000,
  rewriteRules: [
    {
      match: 'https://data.literasee.io',
      replace: 'http://localhost:4000'
    }
  ]
};
