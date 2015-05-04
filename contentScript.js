debugger;
var $modal;
console.log("hello, content script js");

document.onkeydown = function(e){
  // Meta + b
  if (e.keyCode === 66 && e.metaKey) {
    chrome.runtime.sendMessage("Please html for dialog", function (data) {
      $modal = $(data)
      console.log("return value: ", $modal);
      $("body").append($modal);
      $("#pattern").keydown(function (e) {
        console.log("hoge", $(this).val());
      })
      // TODO: 2度目以降は使いまわす
      $modal.on("hidden", function () {
        $(this).remove();
      })
      $modal.modal("show");
    });
  }
};
