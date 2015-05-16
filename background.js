/*global chrome: true, Backbone: true*/

// var chromeFavIconUl = "chrome://theme/IDR_EXTENSIONS_FAVICON@2x"

var sourceList = [],
    _sourceList,
    sourceSet,
    sourceSetList,
    sourceSetListView,
    sourceSetView,
    sourceListView,
    tabs,
    bookmarks = [],
    _bookmarks,
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
  className: "row list-group-item anything-row anything-shown",
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
    var template = this.template(this.model.toJSON());
    this.$el.html(template)

    return this;
  }
});

var SourceList = Backbone.Collection.extend({
  model: Source
});

var SourceSet = Backbone.Model.extend({
  initialize: function () {

  }
});

var SourceSetView = Backbone.View.extend({
  tagName: "div",
  template: _.template($("#anything-source-set-template").html()),
  render: function () {
    var template = this.template(this.model.toJSON());
    this.$el.html(template)
    var sourceListView = new SourceListView({
      collection: this.model.get("sourceList")
    })
    this.$el.append((sourceListView.render().el));
    //    this.$el.append(this.model.get("sourceList").render().el);

    return this;
  }
});

var SourceListView = Backbone.View.extend({
  tagName: 'div',
  className: "list-group",
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

var SourceSetList = Backbone.Collection.extend({
  model: sourceSet
});

var SourceSetListView = Backbone.View.extend({
  tagName: "div",
  className: "anything-source-set-list",
  render: function () {
    this.$el.empty();
    this.collection.each(function (sourceSet) {
      var sourceSetView = new SourceSetView({model: sourceSet});
      this.$el.append(sourceSetView.render().el);
    }, this);

    return this;
  }
});

$("document").ready(function () {
  strModalHtml = getModalHtml();
  initializeSouceList();
});

var getModalHtml = function () {
  var backgroundPage = chrome.extension.getBackgroundPage();
  return backgroundPage.document.getElementById("anything-dialog").outerHTML;
}

var initializeSouceList = function () {

  sourceSetList = new SourceSetList();
  sourceSetListView = new SourceSetListView({
    collection: sourceSetList
  });
  _bookmarks = new SourceList();
  _sourceList = new SourceList();
  
  // bookmark の取得
  // TODO: サブディレクトリを網羅できない．再帰を使う．
  chrome.bookmarks.getChildren("0", function (root) {
    // The `root` is root of bookmark tree. It has each directory
    var length = root.length;
    var bookmarks = new SourceList();
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
            _bookmarks.add(new Source({
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
    sourceSetList.add(new SourceSet({
      sourceType: "Bookmarks",
      sourceList: _bookmarks
    }));
  });

  // 現在開いているタブを取得
  chrome.tabs.getAllInWindow(function (tabsInWindow) {
    //   tabs = tabsInWindow;
    sourceList[0] = {
      type: "tabs",
      list: tabsInWindow
    };
    // backbone style
    _.each(tabsInWindow, function (tab) {
      _sourceList.add(new Source({
        type: "tab",
        tabId: tab.id,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl
      }));
    });
    // sourceListView = new SourceListView({
    //   collection: _sourcelist,
    // });
    sourceSetList.add(new SourceSet({
      sourceType: "Tabs",
      sourceList: _sourceList
    }));
    sourceSetView = new SourceSetView({
      model: sourceSet
    });
//     $("#anything-source-list").append(sourceListView.render().el);
  });

  // タブの変更をソースリストに反映
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
  
  chrome.runtime.onMessage.addListener(
    function (params, sender, sendResponse) {
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
