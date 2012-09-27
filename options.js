/*jslint indent: 2, browser: true */
/*global chrome, options */

window.addEventListener("DOMContentLoaded", function () {
  "use strict";

  chrome.storage.sync.get("watchIds", function (value) {
    options.watchIds.value = value.watchIds.join("\n");
  });

  options.saveOptions.addEventListener("click", function () {
    var watchIds = options.watchIds.value.replace(/\r\n?/, "\n").split("\n");
    chrome.storage.sync.set({ watchIds: watchIds });
  }, false);

}, false);
