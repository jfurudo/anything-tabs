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
  function (message, sender, sendResponse) {    
    sendResponse(strModalHtml);
  });

$("document").ready(function () {
  backgroundPage = chrome.extension.getBackgroundPage();
  strModalHtml = backgroundPage.document.getElementById("myModal").outerHTML;
});

