/**
* removeListeners() removes each on* listener through its own handle, and leaves an active watchPosition delivering
* (WO-097).
*
* It called the native removeAllEventListeners, which clears every listener the plugin holds.  The one
* `watchposition` listener a watch delivers through went with them, so no watch delivered again, and on Android the
* plugin's watch callback, finding no listener, stopped the native watch at its next location.  React Native, Cordova
* and Flutter leave an active watch running.
*
* Loads the CommonJS bundle (dist/plugin.cjs.js) as test/wo_063_default_token_url.test.js does, with @capacitor/core
* stubbed so that registerPlugin() returns a native module that records each listener it is given and each method
* called.  `npm test` builds, then runs this.
*/
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var Types = require('@transistorsoft/background-geolocation-types');

// Load the CJS bundle with a recording native module.
//  - listeners:  one entry per addListener, {event, handler, removed}.  `removed` counts the calls to the remove() of
//    the PluginListenerHandle that addListener resolved.
//  - calls:  the name of every other native method called, in order.
//  - defer:  while true, addListener resolves only when the test calls the entry's resolve().
function loadPlugin() {
    var file = path.join(__dirname, '..', 'dist', 'plugin.cjs.js');
    if (!fs.existsSync(file)) throw new Error('dist/plugin.cjs.js not found:  run `npm run build` first');
    var plugin = {listeners: [], calls: [], defer: false};
    var NativeModule = {
        addListener: function(event, handler) {
            var listener = {event: event, handler: handler, removed: 0};
            var handle = {remove: function() { listener.removed++; return Promise.resolve(); }};
            plugin.listeners.push(listener);
            return new Promise(function(resolve) {
                listener.resolve = function() { resolve(handle); };
                if (!plugin.defer) listener.resolve();
            });
        },
        removeAllEventListeners: function() {
            plugin.calls.push('removeAllEventListeners');
            return Promise.resolve();
        },
        watchPosition: function() {
            plugin.calls.push('watchPosition');
            return Promise.resolve({watchId: 1});
        },
        stopWatchPosition: function() {
            plugin.calls.push('stopWatchPosition');
            return Promise.resolve();
        }
    };
    var sandbox = {
        module: {exports: {}},
        // A subscription removed before its addListener resolved warns.
        console: {log: console.log, error: console.error, warn: function() {}},
        require: function(name) {
            if (name === '@capacitor/core') return {registerPlugin: function() { return NativeModule; }};
            if (name === '@transistorsoft/background-geolocation-types') return Types;
            throw new Error('unexpected require: ' + name);
        }
    };
    sandbox.exports = sandbox.module.exports;
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, {filename: file});
    plugin.BG = sandbox.module.exports;
    return plugin;
}

// Lets every pending promise callback run:  the plugin's subscriptions settle a few ticks after the call.
function settle() { return new Promise(function(resolve) { setImmediate(resolve); }); }

function removed(plugin, event) {
    return plugin.listeners.filter(function(l) { return l.event === event; }).map(function(l) { return l.removed; });
}

// Three on* subscriptions and one watch, settled.
async function subscribe(plugin, onWatch) {
    plugin.BG.onLocation(function() {});
    plugin.BG.onMotionChange(function() {});
    plugin.BG.onEnabledChange(function() {});
    var watch = plugin.BG.watchPosition({interval: 1000}, onWatch || function() {});
    await settle();
    assert.deepStrictEqual(plugin.listeners.map(function(l) { return l.event; }),
                           ['location', 'motionchange', 'enabledchange', 'watchposition']);
    return watch;
}

var tests = [];
function test(name, fn) { tests.push({name: name, fn: fn}); }

test('(WO-097) removeListeners() removes each on* listener through its own handle, once', async function() {
    var plugin = loadPlugin();
    await subscribe(plugin);
    await plugin.BG.removeListeners();
    assert.deepStrictEqual([removed(plugin, 'location'), removed(plugin, 'motionchange'), removed(plugin, 'enabledchange')],
                           [[1], [1], [1]]);
    // A second call finds nothing left to remove.
    await plugin.BG.removeListeners();
    assert.deepStrictEqual([removed(plugin, 'location'), removed(plugin, 'motionchange'), removed(plugin, 'enabledchange')],
                           [[1], [1], [1]]);
});

test('(WO-097) removeListeners() does not call the native removeAllEventListeners', async function() {
    var plugin = loadPlugin();
    await subscribe(plugin);
    await plugin.BG.removeListeners();
    assert.deepStrictEqual(plugin.calls, ['watchPosition'], 'it clears "watchposition" along with every on* event');
});

test('(WO-097) removeListeners() leaves an active watch\'s listener in place, and the watch can still be stopped', async function() {
    var plugin = loadPlugin();
    var delivered = [];
    var watch = await subscribe(plugin, function(location) { delivered.push(location); });
    await plugin.BG.removeListeners();
    assert.deepStrictEqual(removed(plugin, 'watchposition'), [0]);

    plugin.listeners[3].handler({coords: {latitude: 45.5}});
    assert.strictEqual(delivered.length, 1, 'the watch delivers after removeListeners()');

    watch.remove();
    assert.deepStrictEqual(removed(plugin, 'watchposition'), [1]);
    assert.deepStrictEqual(plugin.calls, ['watchPosition', 'stopWatchPosition']);
});

test('(WO-097) an on* whose addListener resolves after removeListeners() removes itself', async function() {
    var plugin = loadPlugin();
    plugin.defer = true;
    plugin.BG.onLocation(function() {});
    await plugin.BG.removeListeners();
    assert.deepStrictEqual(removed(plugin, 'location'), [0], 'still pending:  removeListeners() cannot reach it');

    plugin.listeners[0].resolve();
    await settle();
    assert.deepStrictEqual(removed(plugin, 'location'), [1]);
    // It left nothing behind for a later removeListeners() to remove again.
    await plugin.BG.removeListeners();
    assert.deepStrictEqual(removed(plugin, 'location'), [1]);
});

test('(WO-097) an on* subscribed after removeListeners() stays and delivers, until the next removeListeners()', async function() {
    var plugin = loadPlugin();
    var delivered = [];
    plugin.defer = true;
    await plugin.BG.removeListeners();
    plugin.BG.onLocation(function(location) { delivered.push(location); });
    plugin.listeners[0].resolve();
    await settle();
    assert.deepStrictEqual(removed(plugin, 'location'), [0]);
    plugin.listeners[0].handler({coords: {latitude: 45.5}});
    assert.strictEqual(delivered.length, 1);

    await plugin.BG.removeListeners();
    assert.deepStrictEqual(removed(plugin, 'location'), [1]);
});

// The native side removes a listener some time after removeListeners() resolves, and for a subscription that was
// pending, after the app's next call (MEASURED against @capacitor/core 8.2.0).  An event it sends in between
// still reaches the plugin's handler.
test('(WO-097) an on* callback receives nothing once removeListeners() has run', async function() {
    var plugin = loadPlugin();
    var delivered = [];
    plugin.BG.onLocation(function(location) { delivered.push(location); });
    await settle();
    plugin.defer = true;
    plugin.BG.onEnabledChange(function(enabled) { delivered.push(enabled); });
    await plugin.BG.removeListeners();

    plugin.listeners[0].handler({coords: {latitude: 45.5}});
    plugin.listeners[1].handler({value: false});
    assert.deepStrictEqual(delivered, []);
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
