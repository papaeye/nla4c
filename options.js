window.addEventListener('DOMContentLoaded', function() {
  options.watchIds.value = JSON.parse(localStorage.watchIds || '[]').join("\n");

  options.saveOptions.addEventListener('click', function() {
    var watchIds = options.watchIds.value.replace(/\r\n?/, "\n").split("\n");
    localStorage.watchIds = JSON.stringify(watchIds);
  }, false);

}, false);
