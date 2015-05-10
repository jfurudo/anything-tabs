/*global chrome: true, Backbone: true*/

// var chromeFavIconUl = "chrome://theme/IDR_EXTENSIONS_FAVICON@2x"

var sourceList = [],
    _sourceList,
    sourceListView,
    tabs,
    bookmarks = [],
    backgroundPage,
    strModalHtml,
    regexpFavIconUrl = new RegExp(/^[httpsfilechrome]+:\/{2,3}([0-9a-zA-Z\.\-:]+?):?[0-9]*?\//i);

var getFavIconUrl = function (url) {
  var domain = url.match(regexpFavIconUrl);
  var favIconApiUrl = "http://www.google.com/s2/favicons?domain=";
  return domain ? favIconApiUrl + domain[1] : "";
};

var Source = Backbone.Model.extend({
  initialize: function (attrs, options) {
  },
  validate: function (attrs) {
    if (!attrs.url) {
      return "url is require.";
    }
    if (!attrs.title) {
      return "title is require.";
    }
  }
});

var SourceView = Backbone.View.extend({
  tagName: "div",
  className: "row anything-row anything-shown",
  template: _.template($("#anything-row-template").html()),
  initialize: function () {
    this.model.bind('destroy', this.remove, this);
    this.model.bind('change', this.render, this);
  },
  destory: function () {
    this.model.destory();
  },
  remove: function () {
    this.$el.remove();
  },
  render: function () {
    var sourceModel = this.model.toJSON();

    var template = this.template(this.model.toJSON());
    this.$el.html(template)

    return this;
  }
});

var SourceList = Backbone.Collection.extend({
  model: Source
});

var SourceListView = Backbone.View.extend({
  tagName: 'div',
  template: _.template($('#anything-source-list').html()),
  initialize: function () {
    this.collection.on('add', this.addOne, this);
  },
  addOne: function (source) {
      var sourceView = new SourceView({model: source});
      this.$el.append(sourceView.render().el);
  },
  render: function () {
    this.collection.each(function (source) {
      var sourceView = new SourceView({model: source});
      this.$el.append(sourceView.render().el);
    }, this);

    return this;
  }
});

// tab に変更があったら実行する
chrome.tabs.getAllInWindow(function (tabsInWindow) {
  //   tabs = tabsInWindow;
  sourceList[0] = {
    type: "tabs",
    list: tabsInWindow
  };
  // backbone style
  var tmpSourceList = _.map(tabsInWindow, function (tab) {
    return new Source({
      type: "tab",
      tabId: tab.id,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl
    });
  });
  _sourceList = new SourceList(tmpSourceList);
  sourceListView = new SourceListView({
    collection: _sourceList
  });
  $("#anything-source-list").append(sourceListView.render().el);
});

var toRemoveModel;
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  _sourceList.findWhere({tabId: tabId}).destroy();
});

chrome.tabs.onCreated.addListener(function (tab) {
  _sourceList.add(new Source({
    type: "tab",
    tabId: tab.id,
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl
  }))
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  var source = _sourceList.findWhere({
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

// TODO: サブディレクトリを網羅できない．再帰を使う．
chrome.bookmarks.getChildren("0", function (root) {
  // The `root` is root of bookmark tree. It has each directory
  var length = root.length;
  for (var i = 1; i <= length; i++) {
    chrome.bookmarks.getChildren(String(i), function (children) {
//       console.log(children);
      if (children) {
        _.each(children, function (node) {
          var favIconUrl = node.url.match(regexpFavIconUrl);
          bookmarks.push({
            title: node.title,
            url: node.url,
            id: null, // id is property for tabId
            favIconUrl: favIconUrl ? favIconUrl[1] : null
          });
          // backbone style
          _sourceList.add({
            type: "bookmark",
            title: node.title,
            url: node.url,
            tabId: null, // id is property for tabId
            favIconUrl: getFavIconUrl(node.url)
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
