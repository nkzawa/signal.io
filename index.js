
module.exports = process.env.SIGNALIO_COV
  ? require('./lib-cov')
  : require('./lib');
