/**
* The demo-server url that findOrCreateTransistorAuthorizationToken() and destroyTransistorAuthorizationToken() use
* when the app passes none (WO-063).
*
* It was `http://tracker.transistorsoft.com`.  Android 9+ refuses cleartext and iOS's App Transport Security refuses
* http unless the app opts in, so registration failed, the call resolved a DUMMY_TOKEN, and the token pointed
* `http.url` and `authorization.refreshUrl` at an http url the OS refuses too.  React Native, Cordova, Flutter and the
* Kotlin API all default to https.
*
* Loads the CommonJS bundle (dist/plugin.cjs.js) as test/enums.test.js does, with @capacitor/core stubbed so that
* registerPlugin() returns a native module that records each call.  `npm test` builds, then runs this.
*/
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var Types = require('@transistorsoft/background-geolocation-types');

var DEFAULT_URL = 'https://tracker.transistorsoft.com';
var LAN_URL = 'http://192.168.0.100:9000';

// Load the CJS bundle with a recording native module.  getTransistorToken fails the way a refused request does
// (success: false, a status other than 403), so findOrCreate resolves its DUMMY_TOKEN.
function loadPlugin() {
    var file = path.join(__dirname, '..', 'dist', 'plugin.cjs.js');
    if (!fs.existsSync(file)) throw new Error('dist/plugin.cjs.js not found:  run `npm run build` first');
    var calls = [];
    var NativeModule = {
        getTransistorToken: function(args) {
            calls.push({method: 'getTransistorToken', args: args});
            return Promise.resolve({success: false, status: 'x'});
        },
        destroyTransistorToken: function(args) {
            calls.push({method: 'destroyTransistorToken', args: args});
            return Promise.resolve();
        }
    };
    var sandbox = {
        module: {exports: {}},
        // findOrCreate warns on the failure this stub reports.
        console: {log: console.log, error: console.error, warn: function() {}},
        require: function(name) {
            if (name === '@capacitor/core') return {registerPlugin: function() { return NativeModule; }};
            if (name === '@transistorsoft/background-geolocation-types') return Types;
            throw new Error('unexpected require: ' + name);
        }
    };
    sandbox.exports = sandbox.module.exports;
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, {filename: file});
    return {BG: sandbox.module.exports, calls: calls};
}

var tests = [];
function test(name, fn) { tests.push({name: name, fn: fn}); }

test('(WO-063) findOrCreateTransistorAuthorizationToken(org, username) registers with the https demo server', async function() {
    var plugin = loadPlugin();
    await plugin.BG.findOrCreateTransistorAuthorizationToken('o', 'u');
    assert.strictEqual(plugin.calls.length, 1);
    assert.strictEqual(plugin.calls[0].method, 'getTransistorToken');
    assert.strictEqual(plugin.calls[0].args.url, DEFAULT_URL);
});

test('(WO-063) the DUMMY_TOKEN a failed registration resolves carries the https url', async function() {
    var plugin = loadPlugin();
    var token = await plugin.BG.findOrCreateTransistorAuthorizationToken('o', 'u');
    assert.strictEqual(token.accessToken, 'DUMMY_TOKEN');
    assert.strictEqual(token.url, DEFAULT_URL, 'ready() expands token.url into http.url and authorization.refreshUrl');
});

test('(WO-063) destroyTransistorAuthorizationToken() destroys the https demo server\'s token', async function() {
    var plugin = loadPlugin();
    await plugin.BG.destroyTransistorAuthorizationToken();
    assert.strictEqual(plugin.calls.length, 1);
    assert.strictEqual(plugin.calls[0].method, 'destroyTransistorToken');
    assert.strictEqual(plugin.calls[0].args.url, DEFAULT_URL);
});

test('(WO-063) an explicit url, such as a local console\'s http url, is passed through unchanged', async function() {
    var plugin = loadPlugin();
    var token = await plugin.BG.findOrCreateTransistorAuthorizationToken('o', 'u', LAN_URL);
    await plugin.BG.destroyTransistorAuthorizationToken(LAN_URL);
    assert.strictEqual(plugin.calls[0].args.url, LAN_URL);
    assert.strictEqual(token.url, LAN_URL);
    assert.strictEqual(plugin.calls[1].args.url, LAN_URL);
});

(async function() {
    var failures = 0;
    for (var i = 0; i < tests.length; i++) {
        var t = tests[i];
        try {
            await t.fn();
            console.log('  ok   ' + t.name);
        } catch (error) {
            failures++;
            console.log('  FAIL ' + t.name + '\n         ' + error.message.split('\n').join('\n         '));
        }
    }
    console.log('\n' + (tests.length - failures) + '/' + tests.length + ' passed');
    process.exit(failures ? 1 : 0);
})();
