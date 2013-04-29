
chrome.app.runtime.onLaunched.addListener(function() {
  'use strict';
  chrome.app.window.create('window.html');
});
