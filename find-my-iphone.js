/* global devices, __dirname */

"use strict";

const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const ICloud = require(__dirname + '/lib/icloud');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var refreshTimer = new Timer();
var iCloud;
var locationToFixedVal = 4;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let adapter;
function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        name: 'find-my-iphone-community',
        unload: function (callback) {
            refreshTimer.clear();
            if (iCloud)
                iCloud.logout();
            for (var i in devices) {
                if (devices[i].refreshTimer) {
                    clearTimeout(devices[i].refreshTimer);
                    delete devices[i].refreshTimer;
                }
            }
            iCloud = null;
        },
        stateChange: function (id, state) {
            var ar = id.split('.');
            //var dcs = adapter.idToDCS(id);
            var deviceName = ar[2], stateName = ar[3];
            devices.invalidate(id);
            var device = devices.get(deviceName);
            switch (stateName || 'root') {
                case 'lost':
                    var options, ar;
                    ar = state.val.toString().split(';');
                    options = {text: ar.shift()};
                    if (ar.length)
                        options.ownerNbr = ar.shift();
                    if (ar.length)
                        options.passcode = ar.shift();
                    iCloud.lostDevice(device.native.id, options, function (err, data) {
                        setTimeout(manUpdateDevice, 2000);
                    });
                    break;
                case 'alert':
                    if (device && device.native && device.native.id) {
                        var msg = typeof state.val === 'string' && state.val !== "" ? state.val : 'ioBroker Find my iPhone Alert';
                        iCloud.alertDevice(device.native.id, msg, function (err) {
                        });
                    }
                    break;
                case 'refresh':
                    if (device && device.native && device.native.id) {
                        updateWithTimer(device, state.val);
                    }
                    break;
                case 'lostMode':
                    if (!state.val)
                        iCloud.stopLostMode(device.native.id, function () {
                            setTimeout(manUpdateDevice, 2000);
                        });
                    break;
                case 'root':
                switch (deviceName) {
                    case 'refresh':
                        devices.setState(id, false);
                        manUpdateDevice();
                        break;
                }
            }
        },
        ready: function () {
            main();
        }
    });

    adapter = new utils.Adapter(options);

    return adapter;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Timer(func, timeout, v1) {
    if (!(this instanceof Timer)) {
        return new Timer(func, timeout, v1);
    }
    var timer = null;
    this.inhibit = false;
    this.enable = function (bo) {
        this.inhibit = (bo === false);
    };
    this.set = function (func, timeout, v1) {
        if (timer)
            clearTimeout(timer);
        if (this.inhibit)
            return;
        timer = setTimeout(function () {
            timer = null;
            func(v1);
        }, timeout);
    };
    this.clear = function () {
        if (timer) {
            clearTimeout(timer);
            timer = null;
            return true;
        }
        return false;
    };
    this.clearAndInhibit = function () {
        this.inhibit = true;
        this.clear();
    };

    if (func) {
        this.set(func, timeout, v1);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createOurState(device, cb) {
    var dev = new devices.CDevice(0, '');
    var native = {id: device.id};
    if (device.lostDevice)
        native.lostDevice = device.lostDevice;
    dev.setDevice(device.name, {common: {name: device.name, role: 'device'}, native: native});
    dev.createNew('batteryLevel', {val: (device.batteryLevel * 100) >> 0, common: {unit: '%'}});
    dev.createNew('alert', 'ioBroker Find my iPhone Alert');
    dev.createNew('lost', {val: '', common: {name: 'Lost Mode', desc: 'Parameter: usertext[;phone number to call[;passcode]'}});
    dev.createNew('refresh', {val: false, common: {name: 'Refresh this device with shouldLocate=true'}});
    dev.createNew('isLocating', {val: !!device.isLocating, common: {write: false}});
    dev.createNew('latitude', {val: 0.0, common: {write: false, role: 'gps'}});
    dev.createNew('longitude', {val: 0.0, common: {write: false, role: 'gps'}});
    updateOurState(device, dev, cb);
}

function updateOurState(device, dev, cb) {
    if (typeof dev !== 'object') {
        cb = dev;
        dev = new devices.CDevice(0, '');
        var native = {id: device.id};
        if (device.lostDevice)
            native.lostDevice = device.lostDevice;
        dev.setDevice(device.name, {common: {name: device.name, role: 'device'}, native: native});
    }
    dev.set('batteryLevel', {val: (device.batteryLevel * 100) >> 0, common: {unit: '%'}});
    dev.set('lostModeCapable', device.lostModeCapable);
    dev.set('isLocating', !!device.isLocating);
    if (device.location) {
        dev.set('positionType', device.location.positionType);
        dev.set('timeStamp', device.location.timeStamp);
        var tsStr = adapter.formatDate(new Date(device.location.timeStamp), 'YYYY-MM-DD hh:mm:ss');
        dev.set('time', tsStr);
        if (device.name === 'iPhone-7-FL') {
            var xyz = 1;
        }
        dev.set('lostMode', (!!device.lostDevice && (~~device.lostDevice.statusCode) >= 2204));

        // var changed = dev.set('latitude', device.location.latitude);
        // changed |= dev.set('longitude', device.location.longitude);
        var changed = dev.set('latitude', device.location.latitude.toFixed(locationToFixedVal));
        changed |= dev.set('longitude', device.location.longitude.toFixed(locationToFixedVal));
        if (changed) {
            dev.set('map-url', 'http://maps.google.com/maps?z=15&t=m&q=loc:' + device.location.latitude + '+' + device.location.longitude);
            iCloud.getDistance(device, function (err, result) {
                if (!err && result && result.distance && result.duration) {
                    dev.set('distance', result.distance.text);
                    dev.set('duration', result.duration.text);
                }
                iCloud.getAddressOfLocation(device, function (err, location) {
                    if (!err && result) {
                        dev.set('location', location);
                    }
                    cb && setTimeout(cb, 10);
                });
            });
            return;
        }
    }
    cb && setTimeout(cb, 10);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function manUpdateDevice(deviceId, cb) {
    if (iCloud.authenticated === undefined)
        iCloud.authenticated = false;
    updateDevice(deviceId, cb);
}

function updateWithTimer(device, val, cb) {
    var bo, cnt, time, timeout = 30000;
    //devices.setState({ device: device.common.name, state: 'isLocating', val: true });
    devices.setState({device: device.common.name}, 'isLocating', true);
    val = valtype(val);
    if ((bo = typeof val === 'boolean')) {
        cnt = 4;
        timeout = 15000;
    } else {
        if ((time = ~~val) <= 0)
            return;  // time to refresh in minutes
        cnt = time * 2;
    }
    if (device.refreshTimer !== undefined)
        clearTimeout(device.refreshTimer);
    if (iCloud.authenticated === undefined)
        iCloud.authenticated = false;

    var req = {device: device.native.id, shouldLocate: true};
    var doIt = function () {
        manUpdateDevice(req, function (appleDevice) {
            //if (cnt-- <= 0 || (bo && appleDevice.isLocating === false)) {
            if (cnt-- <= 0 || (bo && (!appleDevice || appleDevice.isLocating === false))) {
                delete device.refreshTimer;
                devices.setState({device: device.common.name, state: 'refresh', val: false});
                return;
            }
            req.shouldLocate = !bo;
            device.refreshTimer = setTimeout(doIt, timeout);
        });
    };
    doIt();
}

function forEachAppleDevice(deviceId, setCallback, readyCallback) {
    iCloud.forEachDevice(deviceId, setCallback, devices.update.bind(devices, readyCallback));
}

function updateDevice(deviceId, callback) {
    var func = updateOurState;
    if (deviceId && deviceId !== 'all') {
        func = function (device, doIt) {
            if (device.id !== deviceId && device.id !== deviceId.device)
                return doIt();
            updateOurState(device, callback.bind(1, device));
        };
    }
    forEachAppleDevice(deviceId, func, callback);
}

function createDevices(callback) {
    devices.root.createNew('refresh', {val: false, common: {name: 'Refresh all devices (refreshClient with shouldLocate=false)'}});
    forEachAppleDevice('all', createOurState, function () {
        callback && callback();
    });
}

function decrypt(str) {
    if (!str)
        str = "";
    try {
        var key = 159;
        var pos = 0;
        var ostr = '';
        while (pos < str.length) {
            ostr = ostr + String.fromCharCode(key ^ str.charCodeAt(pos));
            pos += 1;
        }
        return ostr;
    } catch (ex) {
        return '';
    }
}

function setRestartScheduler() {
    adapter.getForeignObject('system.adapter.' + adapter.namespace, function (err, obj) {
        if (err || !obj)
            return;
        if (obj.common.restartSchedule === undefined) {
            obj.common.restartSchedule = "0 3 * * *";
            adapter.setForeignObject('system.adapter.' + adapter.namespace, obj);
        }
    });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function normalizeConfig(config) {
    config.username = decrypt(config.username);
    config.password = decrypt(config.password);
    config.key2Step = decrypt(config.key2Step);
    if (config.locationToFixedVal !== undefined) {
        locationToFixedVal = config.locationToFixedVal;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function main() {
    normalizeConfig(adapter.config);
    setRestartScheduler();

    iCloud = new ICloud(adapter.config.username, adapter.config.password);
    if (adapter.config.key2Step)
        iCloud.password += adapter.config.key2Step;


    adapter.getForeignObject('system.config', function (err, obj) {
        if (!err && obj && obj.common.latitude && obj.common.longitude) {
            iCloud.setOwnLocation(!err && obj ? obj.common : null, createDevices);
            return;
        }
        adapter.getForeignObject('system.adapter.javascript.0', function (err, obj) {
            iCloud.setOwnLocation(!err && obj ? obj.native : null, createDevices);
        });
    });
    adapter.subscribeStates('*');
    adapter.subscribeObjects('*');
}

// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}