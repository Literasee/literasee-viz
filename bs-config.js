module.exports = {
  server: '.',
  files: [
    '*.html',
    'packages/*/index.html',
    'packages/*/build/*'
  ],
  ui: false,
  notify: false,
  ghostMode: false,
  open: 'external',
  host: 'local.literasee.io',
  port: 3001,
  rewriteRules: [
    {
      match: 'https://data.literasee.io',
      replace: 'http://localhost:4000'
    }
  ]
};
