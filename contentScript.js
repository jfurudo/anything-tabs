// debugger;
(function () {
  var $anythingDialog = null,
      previousText = "";

  var initializeDialog = function () {
    chrome.runtime.sendMessage("anything.tabs.getDialog", function (data) {
      $anythingDialog = $(data)
      console.log("return value: ", $anythingDialog);
      $("body").append($anythingDialog);
      $("#pattern").keyup(function (e) {
        if (previousText !== $(this).val()) {
          var filterText = $(this).val();
          previousText = filterText;
          filterRow(filterText);
          setActive(0);
        }
      });
      $anythingDialog.on("hidden.bs.modal", function () {
        $(".anything-row").remove();
      });
      $anythingDialog.on("shown.bs.modal", function () {
        $("#pattern").focus();
      });
    });
  };

  initializeDialog();
  
  var setActive = function (index) {
    $(".anything-row.active").removeClass("active");
    $(".anything-row.anything-shown:eq(" + index + ")").addClass("active");
  };
  
  var filterRow = function (text) {
    var regexp = new RegExp(text, "i");
    $(".anything-row").filter(function (index) {
      return !$(this).text().match(regexp);
    }).hide().removeClass("anything-shown");
    $(".anything-row").filter(function (index) {
      return !!$(this).text().match(regexp);
    }).show().addClass("anything-shown");;
  };

  // React とか使った方がいい？
  var generateRow = function (page) {
    var row = $("<div class='row anything-row'></div>"),
        imgContainer = $("<div class='col-md-1' />"),
        favicon = $("<img class='anything-row-favicon' />"),
        textContainer = $("<div class='col-md-11 anything-text-container' />"),
        title = $("<h6 class='anything-row-title' />"),
        url = $("<h6 class='anything-row-url'><small></small></h4>");

    favicon.attr({src: page.favIconUrl});
    title.text(page.title);
    url.children().text(page.url);

    return row.append([
      imgContainer.append(favicon),
      textContainer.append([title, url])
    ]);
  };

  document.onkeydown = function(e){
    // Meta + b
    if (e.keyCode === 66 && e.metaKey) {
      $anythingDialog.modal("toggle")
      chrome.runtime.sendMessage("anything.tabs.getPageList", function (data) {
        _.each(data, function (page) {
          $("#anything-page-list").append(generateRow(page));
        });
      });
    }
  };

})();
