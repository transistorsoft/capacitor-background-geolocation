/**
* The enum objects the types package's BackgroundGeolocation interface declares on the default export:
* BackgroundGeolocation.LogLevel, .Event, .NotificationPriority, ... (WO-052).
*
* src/index.d.ts types the default export as that interface, so a missing static type-checks and is `undefined`
* at runtime.  This loads the CommonJS bundle (dist/plugin.cjs.js), which checks the class and what `require()`
* returns in one go:  the bundle ends `module.exports = module.exports.default` (rollup.config.mjs), so CJS
* reaches the enum objects only through the class's statics.
*
* No dependencies beyond the installed types package:  `npm test` builds, then runs this.
*/
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var Types = require('@transistorsoft/background-geolocation-types');

// The names the interface declares, read from its declaration, eg:  `LogLevel: typeof import('../../enums/LogLevel').LogLevel;`
// Not every runtime export of the types package:  it also exports enums the interface does not declare
// (MotionActivityType, TrackingMode, ...), and the class must not grow members the declaration lacks.
function declaredEnums() {
    var file = path.join(path.dirname(require.resolve('@transistorsoft/background-geolocation-types')),
                         'core', 'api', 'BackgroundGeolocation.d.ts');
    var source = fs.readFileSync(file, 'utf8');
    var body = source.slice(source.indexOf('export interface BackgroundGeolocation '));
    var names = [];
    var pattern = /^\s*(\w+): typeof import\('[^']*\/enums\/\w+'\)\.\w+;/gm;
    var match;
    while ((match = pattern.exec(body))) names.push(match[1]);
    return names;
}

// Load the CJS bundle as Node would, with @capacitor/core stubbed:  its only top-level call is registerPlugin().
function loadPlugin() {
    var file = path.join(__dirname, '..', 'dist', 'plugin.cjs.js');
    if (!fs.existsSync(file)) throw new Error('dist/plugin.cjs.js not found:  run `npm run build` first');
    var sandbox = {
        module: {exports: {}},
        console: console,
        require: function(name) {
            if (name === '@capacitor/core') return {registerPlugin: function() { return {}; }};
            if (name === '@transistorsoft/background-geolocation-types') return Types;
            throw new Error('unexpected require: ' + name);
        }
    };
    sandbox.exports = sandbox.module.exports;
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, {filename: file});
    return sandbox.module.exports;
}

var tests = [];
function test(name, fn) { tests.push({name: name, fn: fn}); }

test('(WO-052) the interface declaration was read', function() {
    var names = declaredEnums();
    assert.ok(names.length > 0, 'no enum members found:  has BackgroundGeolocation.d.ts changed shape?');
    names.forEach(function(name) {
        assert.ok(Types[name] !== undefined, name + ' is declared but not a runtime export of the types package');
    });
});

test('(WO-052) require() returns the class, carrying every enum object the interface declares', function() {
    var BG = loadPlugin();
    assert.strictEqual(typeof BG, 'function', 'require() returns the BackgroundGeolocation class');
    var missing = declaredEnums().filter(function(name) { return BG[name] !== Types[name]; });
    assert.deepStrictEqual(missing, [], 'BackgroundGeolocation.<name> is not the types package\'s enum object');
    assert.strictEqual(BG.NotificationPriority.High, 1, 'eg:  BackgroundGeolocation.NotificationPriority.High');
});

test('(WO-052) the legacy constants are still there, and agree with the enum objects', function() {
    var BG = loadPlugin();
    assert.strictEqual(BG.EVENT_NOTIFICATIONACTION, Types.Event.NotificationAction);
    assert.strictEqual(BG.NOTIFICATION_PRIORITY_HIGH, Types.NotificationPriority.High);
    assert.strictEqual(BG.ACTIVITY_TYPE_FITNESS, Types.ActivityType.Fitness);
    assert.strictEqual(BG.LOCATION_AUTHORIZATION_ALWAYS, Types.LocationRequest.Always);
    assert.strictEqual(BG.LOG_LEVEL_VERBOSE, Types.LogLevel.Verbose);
});

var failures = 0;
tests.forEach(function(t) {
    try {
        t.fn();
        console.log('  ok   ' + t.name);
    } catch (error) {
        failures++;
        console.log('  FAIL ' + t.name + '\n         ' + error.message.split('\n').join('\n         '));
    }
});
console.log('\n' + (tests.length - failures) + '/' + tests.length + ' passed');
process.exit(failures ? 1 : 0);
