// debugger;
(function () {
  var namespace = "anything.tabs",
      $anythingDialog = null,
      previousText = "";

  var initializeDialog = function () {
    var params = {
      namespace: namespace,
      action: "getDialog"
    };
    chrome.runtime.sendMessage(params, function (data) {
      $anythingDialog = $(data)
      console.log("return value: ", $anythingDialog);
      $("body").append($anythingDialog);
      $("#pattern")
        .keyup(function (e) {
          if (previousText !== $(this).val()) {
            var filterText = $(this).val();
            previousText = filterText;
            filterRow(filterText);
            setActive(0);
          }
        })
        .keydown(function (e) {
          if (e.keyCode === 13) {
            // Enter key
            setActiveTab();
          } else if (e.ctrlKey && e.keyCode === 78) {
            // Ctrl + n
            selectNextSource();
          } else if (e.ctrlKey && e.keyCode === 80) {
            // Ctrl + p
            selectPreviousSource();
          } else if (e.keyCode === 9 && e.shiftKey) {
            // Tab key (no babble)
            selectPreviousSource();
            return false;
          } else if (e.keyCode === 9) {
            // Shift + Tab key (no babble)
            selectNextSource();
            return false;
          }
        });
      $anythingDialog.on("hidden.bs.modal", function () {
        $('anything-source-list').children().remove();
      });
      $anythingDialog.on("shown.bs.modal", function () {
        $("#pattern").focus();
      });
    });
  };

  initializeDialog();

  var setActiveTab = function () {
    var targetId = $(".anything-row.active .anything-row-tab-id").val();
    var params = {
      namespace: namespace,
      action: "setActive",
      args: Number(targetId)
    };
    chrome.runtime.sendMessage(params, function (targetId) {
      console.log("target id:". targetId);
    });
  };

  // 適当すぎ
  var selectNextSource = function () {
    var index = 0;
    $(".anything-shown").each(function (i) {
      if ($(this).hasClass("active")) {
        index = i;
      }
    });
    setActive(index + 1);
  };

  var selectPreviousSource = function () {
    var index = 0;
    $(".anything-shown").each(function (i) {
      if ($(this).hasClass("active")) {
        index = i;
      }
    });
    setActive(index - 1);
  };
  
  var setActive = function (index) {
    $(".anything-row.active").removeClass("active");
    $(".anything-row.anything-shown:eq(" + index + ")").addClass("active");
  };

  var filterRow = function (text) {
    // 適当なので書き直す
    var regexp = new RegExp(text, "i");
    $(".anything-row").filter(function () {
      return !$(this).text().match(regexp);
    }).removeClass("anything-shown");
    $(".anything-row").filter(function () {
      return !!$(this).text().match(regexp);
    }).addClass("anything-shown");
  };

  // Backbone 使った方がいい？
  var generateRow = function (tab) {
    var row = $("<div class='row anything-row anything-shown'></div>"),
        imgContainer = $("<div class='col-md-1' />"),
        favicon = $("<img class='anything-row-favicon' />"),
        textContainer = $("<div class='col-md-11 anything-text-container' />"),
        title = $("<h6 class='anything-row-title' />"),
        url = $("<h6 class='anything-row-url'><small></small></h4>"),
        tabId = $("<input class='anything-row-tab-id' type='hidden' />");

    favicon.attr({src: tab.favIconUrl});
    title.text(tab.title);
    url.children().text(tab.url);
    tabId.val(tab.id);

    return row.append([
      imgContainer.append(favicon),
      textContainer.append([title, url, tabId])
    ]);
  };

  document.onkeydown = function(e){
    if (e.keyCode === 66 && e.metaKey) {
      // Meta + b
      if (!$("#anything-dialog").hasClass("in")) {
        var params = {
          namespace: namespace,
          action: "getSourceList"
        };
        chrome.runtime.sendMessage(params, function (sourceList) {
          _.each(sourceList, function (sourceType) {
            $("#anything-source-list").append($("<h5 class='source-header-row'>" + sourceType.type +  "</h5>"));
            console.log(sourceType);
            _.each(sourceType.list, function (source) {
              $("#anything-source-list").append(generateRow(source));
            });
          });
          setActive(0);
        });
      }
      
      $anythingDialog.modal("toggle")
    }
  };

}());
