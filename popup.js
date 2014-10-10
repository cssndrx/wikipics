  $('.off').hide();

  $('#myonoffswitch').click(function(){
    if ($(this).is(':checked')){
      $('.off').hide();
      $('.on').show();
    }else{
      $('.off').show();
      $('.on').hide();
    }
  });
