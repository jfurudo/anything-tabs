/*global chrome: true, Backbone: true, _: true, Anything: true*/

// var chromeFavIconUl = "chrome://theme/IDR_EXTENSIONS_FAVICON@2x"

var sourceList = new Anything.Collection.SourceList(),
    sourceSet,
    sourceSetList,
    sourceSetListView,
    sourceSetView,
    sourceListView,
    tabs,
    bookmarks,
    backgroundPage,
    strModalHtml,
    regexpFavIconUrl = new RegExp(/^[httpsfilechrome]+:\/{2,3}([0-9a-zA-Z\.\-:]+?):?[0-9]*?\//i);

var getFavIconUrl = function (url) {
  var domain = url.match(Regexpfaviconurl);
  var favIconApiUrl = "http://www.google.com/s2/favicons?domain=";
  return domain ? favIconApiUrl + domain[1] : "";
};

var getModalHtml = function () {
  var backgroundPage = chrome.extension.getBackgroundPage();
  return backgroundPage.document.getElementById("anything-dialog").outerHTML;
}

var initializeSouceList = function () {

  sourceSetList = new Anything.Collection.SourceSetList();
  sourceSetListView = new Anything.View.SourceSetListView({
    collection: sourceSetList
  });
  bookmarks = new Anything.Collection.SourceList();
  sourceList = new Anything.Collection.SourceList();
  
  // bookmark の取得
  // TODO: サブディレクトリを網羅できない．再帰を使う．
  chrome.bookmarks.getChildren("0", function (root) {
    // The `root` is root of bookmark tree. It has each directory
    var length = root.length;
    for (var i = 1; i <= length; i++) {
      chrome.bookmarks.getChildren(String(i), function (children) {
        if (children) {
          _.each(children, function (node) {
            var favIconUrl = node.url.match(regexpFavIconUrl);
            bookmarks.add(new Anything.Model.Source({
              type: "bookmark",
              title: node.title,
              url: node.url,
              tabId: null, // id is property for tabId
              favIconUrl: getFavIconUrl(node.url)
            }));
          })
        }
      });
    }
    sourceSetList.add(new Anything.Model.SourceSet({
      sourceType: "Bookmarks",
      sourceList: bookmarks
    }));
  });

  // 現在開いているタブを取得
  chrome.tabs.getAllInWindow(function (tabsInWindow) {
    _.each(tabsInWindow, function (tab) {
      sourceList.add(new Anything.Model.Source({
        type: "tab",
        tabId: tab.id,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl
      }));
    });
    sourceSetList.add(new Anything.Model.SourceSet({
      sourceType: "Tabs",
      sourceList: sourceList
    }));
  });

  // タブの変更をソースリストに反映
  chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    sourceList.findWhere({tabId: tabId}).destroy();
  });

  chrome.tabs.onCreated.addListener(function (tab) {
    sourceList.add(new Anything.Model.Source({
      type: "tab",
      tabId: tab.id,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl
    }))
  });

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var source = sourceList.findWhere({
      tabId: tabId
    });
    source.set({
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl
    });
    console.log("tab", tab);
    console.log("source", source.toJSON());
  });
  
  chrome.runtime.onMessage.addListener(function (params,
                                                 sender,
                                                 sendResponse) {
    if (params.namespace === "anything.tabs") {
      if (params.action === "getDialog") {
        sendResponse(strModalHtml);
      } else if (params.action === "getSourceList") {
        sourceList[1] = {
          type: "bookmarks",
          list: bookmarks
        };
        sendResponse(sourceList);
      } else if (params.action === "setActive") {
        chrome.tabs.update(params.args, {selected: true});
      } else if (params.action == "getSource") {
        sendResponse(sourceSetListView.render().el.outerHTML);
      }
    } else if (params.namespace === "anything.tabs.test") {
      if (params.action === "getSourceList") {
        console.log("hoge");
        sendResponse(sourceSetListView.render().el.outerHTML);
      }
    }
  });
}

$("document").ready(function () {
  strModalHtml = getModalHtml();
  initializeSouceList();
});
