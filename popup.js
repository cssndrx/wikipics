function turning_on(){
  $('.off').hide();
  $('.on').show();

  chrome.storage.local.set({'isExtensionOn': true}, function() {});
  chrome.tabs.executeScript(null,
        {code:"chrome.storage.local.set({'isExtensionOn': true}, function() {});"});

  // don't need this because setInterval calls this pretty soon
  chrome.tabs.executeScript(null,
        {code:"convert_to_pictures();"});

}

function turning_off(){
  $('.off').show();
  $('.on').hide();

  chrome.storage.local.set({'isExtensionOn': false}, function() {});
  chrome.tabs.executeScript(null,
        {code:"chrome.storage.local.set({'isExtensionOn': false}, function() {});"});

  chrome.tabs.executeScript(null,
        {code:"swap_images_for_link();"});
}


if (localStorage.isExtensionOn = true || (typeof localStorage.isExtensionOn == 'undefined')){
  turning_on();
}else{
  turning_off();
}

$('#myonoffswitch').click(function(){
    if ($(this).is(':checked')){
      turning_on();    

    }else{
      turning_off();
    }
});

