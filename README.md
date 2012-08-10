Niconico Live Alert for Chrome
==============================

A Chrome extension using Niconico Live Alert API and chrome.experimental.socket.

* 16.png, 48.png and 128.png are downloaded from <http://commons.nicovideo.jp/material/nc23924> and resized 16x16, 48x48 and 128x128 pixels respectively.
* se\_click\_1.mp3 is downloaded from <http://www.skipmore.com/sound/index_04.html>.

Prerequisites
-------------

* Google Chrome 21

Install
-------

1. `git clone git://github.com/papaeye/nla4c.git`
2. Go `chrome://flags`
    1. Enable Experimental Extension APIs
    2. Click [Relaunch Now] at the bottom of the window
3. Go `chrome://chrome/extensions/`
    1. Check [Developer mode]
    2. Click [Load unpacked extension...] and select the cloned repository

TODO
----

* Support Google Chrome 22 or later (i.e., ``chrome.socket``)
