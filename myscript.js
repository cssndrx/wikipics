// // grab the url from the first image
function swap_link_for_image($link, $image){
	if ($image !== null){
		$link.html($image);
	}
}

function is_valid_link(ind, elt){
	if (!isElementInViewport(elt)){
		return false;
	}

	var $elt = $(elt);
	if ($elt.parents('.references').length > 0 || $elt.parents('.further-reading').length > 0 || $elt.parents('.infobox').length > 0){
		return false;
	}

	var link = $(elt).attr('href');
	var end = link.slice(Math.min(5, link.length), link.length);
	if (str_contains(end, ':')){
		return false;
	}

	if (str_contains(link, '.php')){
		return false;
	}

	return $elt.hasAttr('title');
}

function get_image($link){
	var link = $link.attr('href');
	var tokens = link.split('/');

	var token = tokens[tokens.length-1];

	var json_link = 'http://en.wikipedia.org/w/api.php?format=json&action=query&generator=images&titles=' + token;

	function get_title(pages){
		var titles = [];
		for (var page in pages){
			titles.push(pages[page].title);
		}

		// filter out the bad ones
		titles.filter(function(x){
			// todo: pick the link that best matches the token

			if (x == "File:Commons-logo.svg"){
				return false;
			}

			var valid_exts = ['.png', '.jpg', '.gif'];
			valid_exts.forEach(function(ext){
				if (x.slice(x.length-4, x.length) == ext){
					return true;
				}
			});

			return false;
		});	


		if (titles.length > 2){
			return titles[2];
		}
		return false;
	}

	$.getJSON(json_link, function(data){
		try{
			var img_name = get_title(data.query.pages); //File:Conjugation.svg			
			if (!img_name){
				return;
			}
		}catch(e){
			return;
		}

		var img_url = 'http://en.wikipedia.org/wiki/' + img_name;

		$.get(img_url, function(data){

			// todo: if img returned is too small... then grab the next index?

			var $img = $(data).find('#file img').first();

			var orig_width = parseFloat($img.attr('width'));
			var orig_height = parseFloat($img.attr('height'));

			if (orig_width > orig_height){
				$img.width(100);
				$img.height(100*orig_height/orig_width);				
			}else{
				$img.height(100);
				$img.width(100*orig_width/orig_height);
			}

			swap_link_for_image($link, $img);
		});
		// grab the first link within

	});

}

$.fn.hasAttr = function(name) {  
   return (this.attr(name) !== undefined) && (this.attr(name) !== false);
};

function str_contains(a, b){
	return a.indexOf(b) > -1;
}


var called = [];

function convert_to_pictures(){
	var $links = $('#bodyContent a').filter(is_valid_link);

	$links.each(function(ind, elt){
		if (called.indexOf(elt) > -1){
			// it is queued, do not call it again
			return;
		}
		called.push(elt);
		
		get_image($(elt));
	});
}

function init(){
	// find the further reading section if exists and add class to it
	$("#Further_reading").parent().nextAll('ul').addClass('further-reading');

	convert_to_pictures();
}

init();

// var scroll_y = 0;
// $(window).scroll(function(){
// 	// only if it is scroll down
// 	var epsilon = 20;
// 	if (window.scrollY > scroll_y + epsilon){
// 		scroll_y = window.scrollY;
// 		convert_to_pictures();
// 	}
// });

var y_min;
var y_max;

y_min = window.scrollY;
y_max = y_min + $(window).height();
console.log('init: y_max ' + y_max + ' y_min ' + y_min);


// todo: window resize
$( window ).resize(function() {
  //$( "#log" ).append( "<div>Handler for .resize() called.</div>" );
  console.log('resizing......');
  convert_to_pictures();
});


$(window).scroll(function(){
	console.log('y_max ' + y_max + ' y_min ' + y_min);
	var epsilon = 20;

	var curr_max = window.scrollY + $(window).height();
	if (curr_max > y_max + epsilon){
		y_max = curr_max;
		convert_to_pictures();
	}

	else if (window.scrollY < y_min - epsilon){
		y_min = window.scrollY;
		convert_to_pictures();
	}

});


function isElementInViewport (el) {
	//special bonus for those using jQuery
    if (el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}


// function is_valid_image(ind, elt){
//    	var $elt = $(elt);
// 	// make sure not a descendant of metadata

// 	if ($elt.parents('.metadata').length > 0 ){
// 		return false;
// 	}

// 	// make sure it is not too small
// 	var min = 70;

// 	var result = ($elt.attr('width') > min) && ($elt.attr('height') > min);

// 	return result;
// }


