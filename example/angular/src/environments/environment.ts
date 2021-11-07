/// Hack environment to conditionally load environment.local.  If it doesn't exist, a warning
/// is generated but the app works.
///
/// If environment.local does exist, you can export your own custom GOOGLE_MAP_API_KEY, eg:
///
/// module.exports = {
///   GOOGLE_MAP_API_KEY: "<my api key>"
/// }
///
declare function require(name:string);

let ENV = {
  GOOGLE_MAP_API_KEY: ''
};

try {
  ENV = require('./environment.local');
} catch (e) {}

export const environment = {
  TRACKER_HOST: 'http://tracker.transistorsoft.com',
  GOOGLE_MAP_API_KEY: ENV.GOOGLE_MAP_API_KEY,
  production: false
};

