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
  port: 3001
};
