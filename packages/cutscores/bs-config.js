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
  port: 3001,
  startPath: 'demo-host.html',
  rewriteRules: [
    {
      match: 'https://data.literasee.io',
      replace: 'http://localhost:4000'
    },
    {
      match: 'literasee.io/public/host-utils.js',
      replace: 'view.local.literasee.io:3000/public/host-utils.js'
    }
  ]
};
