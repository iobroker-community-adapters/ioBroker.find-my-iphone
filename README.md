# This adapter got deprecated and replaced by https://github.com/PfisterDaniel/ioBroker.apple-find-me

<h1>
  <img src="https://raw.githubusercontent.com/ldittmar81/ioBroker.find-my-iphone/master/admin/find-my-iphone.png" width="64"/>
  ioBroker.find-my-iphone
</h1>

![Number of Installations](http://iobroker.live/badges/find-my-iphone-installed.svg) 
![Number of Installations](http://iobroker.live/badges/find-my-iphone-stable.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.find-my-iphone.svg)](https://www.npmjs.com/package/iobroker.find-my-iphone)
[![Downloads](https://img.shields.io/npm/dm/iobroker.find-my-iphone.svg)](https://www.npmjs.com/package/iobroker.find-my-iphone)

[![NPM](https://nodei.co/npm/iobroker.find-my-iphone.png?downloads=true)](https://nodei.co/npm/iobroker.find-my-iphone/)

[![Travis-CI](http://img.shields.io/travis/iobroker-community-adapters/ioBroker.find-my-iphone/master.svg)](https://travis-ci.org/iobroker-community-adapters/ioBroker.find-my-iphone)

[![Dependency Status](https://img.shields.io/david/iobroker-community-adapters/iobroker.find-my-iphone.svg)](https://david-dm.org/iobroker-community-adapters/iobroker.find-my-iphone)
[![Known Vulnerabilities](https://snyk.io/test/github/iobroker-community-adapters/ioBroker.find-my-iphone/badge.svg)](https://snyk.io/test/github/iobroker-community-adapters/ioBroker.find-my-iphone)

## Description

ioBroker Adapter to find Apple devices

## Info

The adapter tries to read its own location from the adapter ioBroker.javascript. If it is not available, the location of the external IP will be determined. Otherwise 0.0+0.0 will be taken. The location is used zu calculate the distance to the device.

### Initial Creation
This adapter was initialy created by @soef at https://github.com/soef/ioBroker.find-my-iphone but not maintained any more, so we moved it to iobroker-community so that bugs could be fixed. thanks @soef for his work.

### Two-step verification (2FA Authentisierung)
If you are using the "new" Two-Step verification/athentication follow this steps:
- Step 1: Connect the adapter with your username and password.
- Step 2: Confirm your registration on one of your devices
- Step 3: Change the password in the adapter by simply adding the 6-digit code
<br><br>
Thanks to Thorsten Voß for this [tip](https://github.com/soef/ioBroker.find-my-iphone/issues/3#issuecomment-289200613).

### States
- **refresh**:<br>
  root: refresh all devices.
  under a device: force the device to relocate and refresh
- **alert**:<br>
  Play a sound on the device.<br> The text of the alert state will be shown on the device.<br>
  Parmeter: [Text]<br>
  Text is optional. If given it will be displayed on the device
- **lost**:<br>
  Switch the device to **Lost Mode**.<br>
  *Parameter: usertext[;phone number to call[;passcode]]*<br>
  If the passcode parameter is given, the passcode of the device will be set, if it not was already set.<br>
  Note: After unlocking the device it can be used as usual. If no passcode was specified and the device did not have a passcode, a swipe is enough to use it.<br>
  Tip: Can also be used to prevent children from playing with the unit
- **lostMode**:<br>
  boolean. If in lost mode, this can be set to false to stop the lost mode.
- **location**:<br>
  Address of the device position
- **map-url**:<br>
  Google mapps url with the position of the device
- **positionType**:<br>
  WiFi|GPS 
- **Self-explanatory**:<br>
  batteryLevel, longitude, latitide, time, timeState 

## Changelog

### 1.0.0 (2019-04-01)
* (ldittmar) first version for the community

## License
The MIT License (MIT)

Copyright (c) 2015 - 2019 soef <soef@gmx.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
