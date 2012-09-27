/*jslint indent: 2, browser: true */
/*global options */

window.addEventListener("DOMContentLoaded", function () {
  "use strict";

  options.watchIds.value = JSON.parse(localStorage.watchIds || '[]').join("\n");

  options.saveOptions.addEventListener("click", function () {
    var watchIds = options.watchIds.value.replace(/\r\n?/, "\n").split("\n");
    localStorage.watchIds = JSON.stringify(watchIds);
  }, false);

}, false);
