/*global chrome: true*/

var sourceList = [],
    tabs,
    bookmarks = [],
    backgroundPage,
    strModalHtml;

// tab に変更があったら実行する
chrome.tabs.getAllInWindow(function (tabsInWindow) {
  //   tabs = tabsInWindow;
  sourceList[0] = {
    type: "tabs",
    list: tabsInWindow
  };
});

// TODO: サブディレクトリを網羅できない．再帰を使う．
chrome.bookmarks.getChildren("0", function (root) {
  // The `root` is root of bookmark tree. It has each directory
  var length = root.length;
  for (var i = 1; i <= length; i++) {
    chrome.bookmarks.getChildren(String(i), function (children) {
      console.log(children);
      if (children) {
        _.each(children, function (node) {
          bookmarks.push({
            title: node.title,
            url: node.url,
            id: null, // id is property for tabId
            favIconUrl: null
          });
        })
      }
    });
  }
});

chrome.runtime.onMessage.addListener(
  function (params, sender, sendResponse) {
    if (params.action === "getDialog") {
      sendResponse(strModalHtml);
    } else if (params.action === "getSourceList") {
      sourceList[1] = {
        type: "bookmarks",
        list: bookmarks
      };
      sendResponse(sourceList);
      // sendResponse(bookmarks);
      // 1回しかレスポンスを返せない？
      // まとめて返したほうが良い．
      // TODO: sourceList のフォーマットを考える
      // [
      //   {
      //     type: "tabs",
      //     list: tabs
      //   },
      //   {
      //     type: "bookmarks",
      //     list: bookmarks
      //   }
      // ]
      // みたいなやつ
    } else if (params.action === "setActive") {
      chrome.tabs.update(params.args, {selected: true});
    }
  });

$("document").ready(function () {
  backgroundPage = chrome.extension.getBackgroundPage();
  strModalHtml = backgroundPage.document.getElementById("anything-dialog").outerHTML;
});

