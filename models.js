/*global chrome: true, Backbone: true, _: true*/

var Anything = {};

Anything.Model = {
  Source: Backbone.Model.extend({
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
  }),
  SourceSet: Backbone.Model.extend({
    initialize: function () {}
  }),
};

Anything.Collection = {
  SourceList: Backbone.Collection.extend({
    model: Anything.Model.Source
  }),
  SourceSetList: Backbone.Collection.extend({
    model: Anything.Model.SourceSet
  })
}

Anything.View = {
  SourceView: Backbone.View.extend({
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
  }),
  SourceListView: Backbone.View.extend({
    tagName: 'div',
    className: "list-group",
    initialize: function () {
      this.collection.on('add', this.addOne, this);
    },
    addOne: function (source) {
      var sourceView = new Anything.View.SourceView({model: source});
      this.$el.append(sourceView.render().el);
    },
    render: function () {
      this.collection.each(function (source) {
        var sourceView = new Anything.View.SourceView({model: source});
        this.$el.append(sourceView.render().el);
      }, this);

      return this;
    }
  }),
  SourceSetView: Backbone.View.extend({
    tagName: "div",
    template: _.template($("#anything-source-set-template").html()),
    render: function () {
      var template = this.template(this.model.toJSON());
      this.$el.html(template)
      var sourceListView = new Anything.View.SourceListView({
        collection: this.model.get("sourceList")
      })
      this.$el.append((sourceListView.render().el));

      return this;
    }
  }),
  SourceSetListView: Backbone.View.extend({
    tagName: "div",
    className: "anything-source-set-list",
    render: function () {
      this.$el.empty();
      this.collection.each(function (sourceSet) {
        var sourceSetView = new Anything.View.SourceSetView({model: sourceSet});
        this.$el.append(sourceSetView.render().el);
      }, this);

      return this;
    }
  })
}
