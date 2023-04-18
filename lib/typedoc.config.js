const { version } = require('./package.json');

module.exports = {
  entryPoints: ['./config.ts'],
  out: '../docs',
  githubPages: false,
  gitRevision: version,
  readme: './README-docs.md'
};
