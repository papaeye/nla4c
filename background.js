const audio = new Audio("se_click_1.mp3");

function notify(title, body, icon, broadcast_id) {
  var notification = webkitNotifications.createNotification(icon, title, body);

  notification.ondisplay = function() {
    // Dismiss the notification window after 3 seconds.
    setTimeout(function() { notification.cancel(); },
               3 * 1000);
  };
  notification.onclick = function() {
    window.open("http://live.nicovideo.jp/watch/lv" + broadcast_id);
    this.cancel();
  };
  notification.show();
  audio.play();
}

function requestAlertInfo(callback) {
  var xhr = new XMLHttpRequest(),
      url = "http://live.nicovideo.jp/api/getalertinfo";

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var xml = xhr.responseXML,
          addr = xml.querySelector("addr").textContent,
          port = xml.querySelector("port").textContent,
          threadId = xml.querySelector("thread").textContent;

      console.log({"addr": addr, "port": port, "threadId": threadId});
      callback(addr, parseInt(port, 10), threadId);
    }
  };
  xhr.open("GET", url, true);
  xhr.send(null);
}

function requestBroadcastInfo(broadcast_id, callback) {
  var xhr = new XMLHttpRequest(),
      url = "http://live.nicovideo.jp/api/getstreaminfo/lv" + broadcast_id;

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var xml = xhr.responseXML,
          title = xml.querySelector("title").textContent,
          description = xml.querySelector("description").textContent,
          icon = xml.querySelector("thumbnail").textContent;

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
  f.onload = function(e) {
    callback(e.target.result);
  };
  f.readAsArrayBuffer(new Blob([str]));
}

function arrayBuffer2String(buf, callback) {
  var f = new FileReader();
  f.onload = function(e) {
    callback(e.target.result);
  };
  f.readAsText(new Blob([new Uint8Array(buf)]));
}

const socket = chrome.experimental.socket;
const expectedMessagePattern = /<chat [^>]+>(\d+,co\d+,\d+)<\/chat>/;

function runClient(addr, port, threadId, watchIds) {
  var socketId,
      bytesWritten = 0,
      initialMessage = '<thread thread="' + threadId +
        '" version="20061206" res_from="-1"/>\0';

  function onDataRead(readInfo) {
    socket.read(socketId, onDataRead);

    arrayBuffer2String(readInfo.data, function(string) {
      // console.log(string);
      var messages = string.replace(/\0$/, "").split("\0");

      for (var i = 0, len = messages.length; i < len; ++i) {
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
    });
  }

  function onWrite(writeInfo) {
    bytesWritten += writeInfo.bytesWritten;
    if (bytesWritten == initialMessage.length) {
      socket.read(socketId, onDataRead);
    }
  }

  function onConnect(result) {
    string2ArrayBuffer(initialMessage, function(arrayBuffer) {
      socket.write(socketId, arrayBuffer, onWrite);
    });
  }

  function onCreate(socketInfo) {
    socketId = socketInfo.socketId;
    socket.connect(socketId, addr, port, onConnect);
  }

  socket.create('tcp', {}, onCreate);
}

(function() {
  if (!localStorage.watchIds) {
    localStorage.watchIds = JSON.stringify([]);
  }

  var watchIds = JSON.parse(localStorage.watchIds).filter(function(e) {
    return e.lastIndexOf('co', 0) == 0;
  });
  console.log(watchIds);

  requestAlertInfo(function(addr, port, threadId) {
    runClient(addr, port, threadId, watchIds);
  });
}());
