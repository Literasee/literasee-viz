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
  host: 'literasee.local',
  port: 3001
};
