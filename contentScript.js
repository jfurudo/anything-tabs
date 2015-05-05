debugger;
var $anythingDialog = null,
    isOpenDialog = false;
console.log("hello, content script js");

document.onkeydown = function(e){
  // Meta + b
  if (e.keyCode === 66 && e.metaKey) {
    if (!$anythingDialog) {
      chrome.runtime.sendMessage("anything.tabs.getDialog", function (data) {
        $anythingDialog = $(data)
        console.log("return value: ", $anythingDialog);
        $("body").append($anythingDialog);
        $("#pattern").keydown(function (e) {
          console.log("hoge", $(this).val());
        });
        // TODO: 2度目以降は使いまわす
        $anythingDialog.on("hidden.bs.modal", function () {
          $(this).remove();
        })
        $anythingDialog.on("shown.bs.modal", function () {
          $("#pattern").focus();
        });
        $anythingDialog.modal("show");
      });
    } else {
      $anythingDialog.modal("toggle")
    }
    chrome.runtime.sendMessage("anything.tabs.getPageList", function (data) {
      _.each(data, function (page) {
        $("#anything-page-list").append(generateAnythingTabListColumn(page));
      })
    });
  }
};

// React とか使った方がいい？
var generateAnythingTabListColumn = function (page) {
  var col = $("<div class='row anything-col'></div>"),
      imgContainer = $("<div class='col-md-1' />"),
      favicon = $("<img class='anything-col-favicon' />"),
      textContainer = $("<div class='col-md-11 anything-text-container' />"),
      title = $("<h6 class='anything-col-title' />"),
      url = $("<h6 class='anything-col-url'><small></small></h4>");

  favicon.attr({src: page.favIconUrl});
  title.text(page.title);
  url.children().text(page.url);

  return col.append([
    imgContainer.append(favicon),
    textContainer.append([title, url])
  ]);
}
