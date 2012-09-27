/*jslint indent: 2, browser: true, continue: true, devel: true, plusplus: true, regexp: true, sloppy: true, vars: true */
/*global Audio, webkitNotifications, FileReader, Blob, Uint8Array, chrome */

var audio = new Audio("se_click_1.mp3");

function notify(title, body, icon, broadcast_id) {
  var notification = webkitNotifications.createNotification(icon, title, body);

  notification.ondisplay = function () {
    setTimeout(function () { notification.cancel(); },
               5 * 1000);
  };
  notification.onclick = function () {
    window.open("http://live.nicovideo.jp/watch/lv" + broadcast_id);
    this.cancel();
  };
  notification.show();
  audio.play();
}

function requestAlertInfo(callback) {
  var xhr = new XMLHttpRequest();
  var url = "http://live.nicovideo.jp/api/getalertinfo";

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var xml = xhr.responseXML;
      var addr = xml.querySelector("addr").textContent;
      var port = xml.querySelector("port").textContent;
      var threadId = xml.querySelector("thread").textContent;

      console.log({"addr": addr, "port": port, "threadId": threadId});
      callback(addr, parseInt(port, 10), threadId);
    }
  };
  xhr.open("GET", url, true);
  xhr.send(null);
}

function requestBroadcastInfo(broadcast_id, callback) {
  var xhr = new XMLHttpRequest();
  var url = "http://live.nicovideo.jp/api/getstreaminfo/lv" + broadcast_id;

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var xml = xhr.responseXML;
      var title = xml.querySelector("title").textContent;
      var description = xml.querySelector("description").textContent;
      var icon = xml.querySelector("thumbnail").textContent;

      // console.log(xml);
      // console.log({"title": title, "description": description, "icon": icon});
      callback(title, description, icon, broadcast_id);
    }
  };
  xhr.open("GET", url, true);
  xhr.send(null);
}

// http://goo.gl/UDanx
function string2ArrayBuffer(str, callback) {
  var f = new FileReader();
  f.onload = function (e) {
    callback(e.target.result);
  };
  f.readAsArrayBuffer(new Blob([str]));
}

function arrayBuffer2String(buf, callback) {
  var f = new FileReader();
  f.onload = function (e) {
    callback(e.target.result);
  };
  f.readAsText(new Blob([new Uint8Array(buf)]));
}

var socket = chrome.socket;
var expectedMessagePattern = /<chat [^>]+>(\d+,(co\d+|ch\d+|official),\d+)<\/chat>/;

function runClient(addr, port, threadId, watchIds) {
  var socketId;
  var bytesWritten = 0;
  var initialMessage = '<thread thread="' + threadId +
        '" version="20061206" res_from="-1"/>\u0000';

  function onDataRead(readInfo) {
    arrayBuffer2String(readInfo.data, function (string) {
      // console.log(string);
      var messages = string.replace(/\u0000$/, "").split("\u0000");

      var i, len;
      for (i = 0, len = messages.length; i < len; ++i) {
        var match = messages[i].match(expectedMessagePattern);
        if (match) {
          var broadcast = match[1].split(",");

          if (watchIds.indexOf(broadcast[1]) >= 0) {
            console.log({"broadcast_id": broadcast[0],
                         "community_id": broadcast[1],
                         "broadcaster_id": broadcast[2]});
            requestBroadcastInfo(broadcast[0], notify);
          }
        }
      }

      socket.read(socketId, onDataRead);
    });
  }

  function onWrite(writeInfo) {
    bytesWritten += writeInfo.bytesWritten;
    if (bytesWritten === initialMessage.length) {
      socket.read(socketId, onDataRead);
    }
  }

  function onConnect(result) {
    string2ArrayBuffer(initialMessage, function (arrayBuffer) {
      socket.write(socketId, arrayBuffer, onWrite);
    });
  }

  function onCreate(socketInfo) {
    socketId = socketInfo.socketId;
    socket.connect(socketId, addr, port, onConnect);
  }

  socket.create('tcp', {}, onCreate);
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ watchIds: [] });
});

chrome.app.runtime.onLaunched.addListener(function () {
  chrome.storage.sync.get("watchIds", function (value) {
    var watchIds = value.watchIds.filter(function (e) {
      return e.lastIndexOf('co', 0) === 0;
    });
    console.log(watchIds);

    requestAlertInfo(function (addr, port, threadId) {
      runClient(addr, port, threadId, watchIds);
    });
  });
});
