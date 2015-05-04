window.onopen = function () {
  console.log("popup opened");
  chrome.runtime.sendMessage({
    event: "open"
  }, function (tabs) {
    console.log(tabs);
  });
};
