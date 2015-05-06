var tabs = [],
    backgroundPage,
    strModalHtml;

chrome.tabs.getAllInWindow(function (tabsInWindow) {
  tabs = tabsInWindow;
  // _.each(tabs, function (tab) {
  //   console.log(tab);
  // });
});

console.log("hello");

chrome.runtime.onMessage.addListener(
  function (params, sender, sendResponse) {
    if (params.action === "getDialog") {
      sendResponse(strModalHtml);
    } else if (params.action === "getSourceList") {
      sendResponse(tabs);
    } else if (params.action === "setActive") {
      chrome.tabs.update(params.args, {selected: true});
    }
  });

$("document").ready(function () {
  backgroundPage = chrome.extension.getBackgroundPage();
  strModalHtml = backgroundPage.document.getElementById("anything-dialog").outerHTML;
});

