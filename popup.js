function turning_on(){
  $('.off').hide();
  $('.on').show();
  // $('input').prop('checked', true);

  chrome.storage.sync.set({'isExtensionOn': true}, function() {});
  chrome.tabs.executeScript(null,
        {code:"chrome.storage.sync.set({'isExtensionOn': true}, function() {});"});

  // call the extension
  chrome.tabs.executeScript(null,
        {code:"convert_to_pictures();"});

}

function turning_off(){
  $('.off').show();
  $('.on').hide();
  // $('input').prop('checked', false);

  chrome.storage.sync.set({'isExtensionOn': false}, function() {});
  chrome.tabs.executeScript(null,
        {code:"chrome.storage.sync.set({'isExtensionOn': false}, function() {});"});

  chrome.tabs.executeScript(null,
        {code:"swap_images_for_link();"});
}


chrome.storage.sync.get('isExtensionOn', function (items){
  if (items.isExtensionOn || (typeof items.isExtensionOn == 'undefined') ){
    turning_on();    
  }else{
    turning_off();
  }
});

// function apply_transition(sel){
//   $(sel).css({
//                     '-webkit-transition': 'margin 0.3s ease-in 0s',
//                     'transition': 'margin 0.3s ease-in 0s',
//             });
// }
// function remove_transition(sel){
//   $(sel).css({'-webkit-transition': '',
//                       'transition': ''});  
// }

// $('#myonoffswitch').click(function(){
//     apply_transition('.onoffswitch-inner');
//     apply_transition('.onoffswitch-switch');

//     if ($(this).is(':checked')){
//         turning_on();
//     }else{
//       turning_off();
//     }

//     remove_transition('.onoffswitch-inner');
//     remove_transition('.onoffswitch-switch');

// });

$('.on').click(function(){
  turning_off();
});

$('.off').click(function(){
  turning_on();
});
