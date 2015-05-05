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
    if (message === "anything.tabs.getDialog") {
      sendResponse(strModalHtml);
    } else if (message === "anything.tabs.getPageList") {
      sendResponse(tabs);
    }
  });

$("document").ready(function () {
  backgroundPage = chrome.extension.getBackgroundPage();
  strModalHtml = backgroundPage.document.getElementById("myModal").outerHTML;
});

