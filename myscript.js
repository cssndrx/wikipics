
// grab the url from the first image
function swap_link_for_image($link, $image){
	if ($image !== null){
		$link.html($image);
	}

	// so that it does not get shown upon hover
	$link.data('title', $link.attr('title'));
	$link.removeAttr("title");
}


var storage = {};
function swap_images_for_link(){
	$('.replacement-container').each(function(){

		// put this away for later in case user toggles back on
		var $parent = $(this).parent();
		var key = $parent.attr('href') + $parent.attr('title');
		storage[key] = $(this);

		var text = $(this).find('.replacement-label').text();
		$parent.text(text);

		$(this).attr('title', $(this).data('title'));
	});
}

function is_link_we_want_to_replace(ind, elt){
	if (!isElementInViewport(elt)){
		return false;
	}

	var $elt = $(elt);
	if ($elt.parents('.references').length > 0 || $elt.parents('.further-reading').length > 0 || $elt.parents('.infobox').length > 0 || $elt.parents('.thumbinner').length > 0 || $elt.parents('.vertical-navbox').length > 0 || $elt.parents('.navbox').length > 0 || $elt.parents('.plainlinks').length > 0 || $elt.parents('#coordinates').length > 0 || $elt.parents('.citation').length > 0){
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
	function get_token($link){
		var link = $link.attr('href');
		var tokens = link.split('/');
		return tokens[tokens.length-1];		
	}

	var replacement_size = 200;

	function get_api_link($link){
		return 'http://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=' + replacement_size + '&titles=' + get_token($link); //&pithumbsize=100;
	}

	// get the image files listed on the api link for the webpage
	$.getJSON(get_api_link($link), function(data){
		// move link from spawned to returned
		spawned.splice($link[0], 1);
		returned.push($link[0]);


		var img_url;
		var img_height;
		var img_width;
		try{
			for (var page_id in data.query.pages){
				var page = data.query.pages[page_id];
				img_url = page.thumbnail.source;
				img_height = page.thumbnail.height;
				img_width = page.thumbnail.width;
			}
		}catch(e){
			console.log(e);
			return;
		}

		var $img = $('<img>').attr('src', img_url);
		$img.addClass('replacement-image');
		$img.attr('test', img_url);

		// // not working due to browser image drag
		// $img.on('mousedown', function(e) {
		//     $(this).data('p0', { x: e.pageX, y: e.pageY });
		// }).on('mouseup', function(e) {
		//     var p0 = $(this).data('p0'),
		//         p1 = { x: e.pageX, y: e.pageY },
		//         d = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
		//         console.log('dragged ' + d);
		//     // resize the image 
		// });

//		console.log($img.attr('height') + '    ' + $img.attr('width'));
		var $cont = $('<span style="position:relative; display:inline-block;"></span>');
		var $label = $('<span class="replacement-label" style="position:absolute; display:block; background-color:rgba(0,0,0,0.8); color:white; white-space:nowrap; word-wrap: break-word;"></span>')
						.text($link.text())
						.css('max-width', img_width);
		$label.css('top', img_height/2 - 10); //-2
		$cont.append($label);
		$cont.append($img);
		$cont.addClass('replacement-container');

		$cont.mouseenter(function(){
			$label.fadeOut();
		}).mouseleave(function(){
			$label.fadeIn();
		});
		swap_link_for_image($link, $cont);

	});

}

$.fn.hasAttr = function(name) {  
   return (this.attr(name) !== undefined) && (this.attr(name) !== false);
};

function str_contains(a, b){
	return a.indexOf(b) > -1;
}


var returned = [];
var spawned = [];
var max_spawns = 20;

function convert_to_pictures(){

	chrome.storage.sync.get('isExtensionOn', function(items) {
		if ((typeof items == 'undefined') || items.isExtensionOn){
			convert_to_pictures_helper();
		}
	});
}

function isEmpty(object) { for(var i in object) { return true; } return false; }

function convert_to_pictures_helper(){
	var $links = $('#bodyContent a');

	// warning: this might be bad performance?
	// maybe we could fix the is_link_we_want_to replace?
	$links.each(function(ind, elt){
		var key = $(elt).attr('href') + $(elt).attr('title');
		if (key in storage){
			// it has been stored away
			$(elt).html(storage[key]);
			return;
		}		
	});		

	$links = $links.filter(is_link_we_want_to_replace);
	$links.each(function(ind, elt){
		if (returned.indexOf(elt) > -1 || spawned.indexOf(elt) > -1){
			// it is queued, do not call it again
			return;
		}

		if (spawned.length > max_spawns){
			return;
		}

		spawned.push(elt);
		
		get_image($(elt));
	});
}

function init(){
	// find the further reading section if exists and add class to it
	$("#Further_reading").parent().nextAll('ul').addClass('further-reading');

	convert_to_pictures();
}

init();


var y_min;
var y_max;

y_min = window.scrollY;
y_max = y_min + $(window).height();
//console.log('init: y_max ' + y_max + ' y_min ' + y_min);


$( window ).resize(function() {
  console.log('resizing......');
  convert_to_pictures();
});


$(window).scroll(function(){
//	console.log('y_max ' + y_max + ' y_min ' + y_min);
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

setInterval(convert_to_pictures, 2000);