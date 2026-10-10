/**
* What removeGeofences() hands to the native module (WO-055).
*
* "Remove all" is the absence of a list: an omitted argument crosses as `undefined` (an absent key on the wire) and
* `null` as `null`; the native plugins send both to the core's remove-all entry.  An empty list crosses as `[]`, which
* removes none.  Through 9.7.0 an omitted argument was sent as `[]`, and `[]` removed every geofence.
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

test('(WO-055) removeGeofences() sends no list: the key is absent on the wire, which removes all', async function() {
    var plugin = loadPlugin();
    assert.strictEqual(await plugin.BG.removeGeofences(), true);
    assert.strictEqual(plugin.calls.length, 1);
    assert.strictEqual(plugin.calls[0].identifiers, undefined);
    assert.strictEqual(JSON.stringify(plugin.calls[0]), '{}');
});

test('(WO-055) removeGeofences(null) sends null, which removes all', async function() {
    var plugin = loadPlugin();
    await plugin.BG.removeGeofences(null);
    assert.strictEqual(plugin.calls[0].identifiers, null);
});

test('(WO-055) removeGeofences([]) sends the empty list, which removes none', async function() {
    var plugin = loadPlugin();
    assert.strictEqual(await plugin.BG.removeGeofences([]), true);
    assert.strictEqual(JSON.stringify(plugin.calls[0]), '{"identifiers":[]}');
});

test('(WO-055) removeGeofences([ids]) sends the list unchanged', async function() {
    var plugin = loadPlugin();
    await plugin.BG.removeGeofences(['home', 'work']);
    assert.strictEqual(JSON.stringify(plugin.calls[0]), '{"identifiers":["home","work"]}');
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
