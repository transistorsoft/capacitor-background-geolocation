/**
* What removeGeofences() hands to the native module (WO-055).
*
* "Remove all" is the absence of a list: an omitted argument or `null`.  It crosses as `[]`, as it does in every
* release, because both cores read an empty list as "remove all".  So an empty list the caller passed never crosses:
* it names none, and is answered in JavaScript.  Through 9.7.0 it was sent, and removed every geofence.
*
* Anything else that is not a list rejects before the native call, and never becomes "all".
*
* Loads the CommonJS bundle (dist/plugin.cjs.js) as test/wo_063_default_token_url.test.js does, with @capacitor/core
* stubbed so that registerPlugin() returns a native module that records each call.  `npm test` builds, then runs this.
*/
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var Types = require('@transistorsoft/background-geolocation-types');

function loadPlugin() {
    var file = path.join(__dirname, '..', 'dist', 'plugin.cjs.js');
    if (!fs.existsSync(file)) throw new Error('dist/plugin.cjs.js not found:  run `npm run build` first');
    var calls = [];
    var NativeModule = {
        removeGeofences: function(args) {
            calls.push(args);
            return Promise.resolve();
        }
    };
    var sandbox = {
        module: {exports: {}},
        console: console,
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

test('(WO-055) removeGeofences() sends []: remove all, as every release sends it', async function() {
    var plugin = loadPlugin();
    assert.strictEqual(await plugin.BG.removeGeofences(), true);
    assert.strictEqual(plugin.calls.length, 1);
    assert.strictEqual(JSON.stringify(plugin.calls[0]), '{"identifiers":[]}');
});

test('(WO-055) removeGeofences(null) sends []: remove all', async function() {
    var plugin = loadPlugin();
    await plugin.BG.removeGeofences(null);
    assert.strictEqual(plugin.calls.length, 1);
    assert.strictEqual(JSON.stringify(plugin.calls[0]), '{"identifiers":[]}');
});

test('(WO-055) removeGeofences([]) resolves without calling native: remove none', async function() {
    var plugin = loadPlugin();
    assert.strictEqual(await plugin.BG.removeGeofences([]), true);
    assert.strictEqual(plugin.calls.length, 0, 'native was handed ' + JSON.stringify(plugin.calls[0]));
});

test('(WO-055) removeGeofences([ids]) sends the list unchanged', async function() {
    var plugin = loadPlugin();
    await plugin.BG.removeGeofences(['home', 'work']);
    assert.strictEqual(JSON.stringify(plugin.calls[0]), '{"identifiers":["home","work"]}');
});

[
    ['NaN', NaN], ['Infinity', Infinity], ['a function', function() {}], ['a Symbol', Symbol('home')],
    ['a string', 'home'], ['an empty string', ''], ['a number', 42], ['false', false], ['an object', {identifier: 'home'}]
].forEach(function(item) {
    test('(WO-055) removeGeofences(' + item[0] + ') rejects without calling native', async function() {
        var plugin = loadPlugin();
        var rejection = null;
        try { await plugin.BG.removeGeofences(item[1]); } catch (error) { rejection = error; }
        assert.strictEqual(plugin.calls.length, 0, 'native was handed ' + JSON.stringify(plugin.calls[0]));
        assert.strictEqual(typeof rejection, 'string', 'rejects with a message');
    });
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
