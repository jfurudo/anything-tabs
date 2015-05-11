/*global chrome: true, Backbone: true*/

var params = {
  namespace: "anything.tabs.test",
  action: "getSourceList"
}

chrome.runtime.sendMessage(params, function (sourceListViewEl) {
  $("body").append(sourceListViewEl);
});
