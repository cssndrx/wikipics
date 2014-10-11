function lcs(string1, string2){
	// init max value
	var longestCommonSubstring = 0;
	// init 2D array with 0
	var table = [],
            len1 = string1.length,
            len2 = string2.length,
            row, col;
	for(row = 0; row <= len1; row++){
		table[row] = [];
		for(col = 0; col <= len2; col++){
			table[row][col] = 0;
		}
	}
	// fill table
        var i, j;
	for(i = 0; i < len1; i++){
		for(j = 0; j < len2; j++){
			if(string1[i]==string2[j]){
				if(table[i][j] == 0){
					table[i+1][j+1] = 1;
				} else {
					table[i+1][j+1] = table[i][j] + 1;
				}
				if(table[i+1][j+1] > longestCommonSubstring){
					longestCommonSubstring = table[i+1][j+1];
				}
			} else {
				table[i+1][j+1] = 0;
			}
		}
	}
	return longestCommonSubstring;
}

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
	if ($elt.parents('.references').length > 0 || $elt.parents('.further-reading').length > 0 || $elt.parents('.infobox').length > 0 || $elt.parents('.thumbinner').length > 0 || $elt.parents('.vertical-navbox').length > 0 || $elt.parents('.navbox').length > 0 || $elt.parents('.plainlinks').length > 0){
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
	function pick_image(pages){
		function clean_token(token){
			if (token.indexOf('(') > -1 && token.indexOf(')') > -1){
				// remove the stuff in parentheses
				token =  token.slice(0, token.indexOf('(')) + token.slice(token.indexOf(')')+1, token.length);
			}

			// if a link is formatted as something#some.... just return some
			if (token.indexOf('#') > -1){
				token = token.slice(token.indexOf('#')+1, token.length);
			}

			return token.toLowerCase();
		}

		var titles = [];
		for (var page in pages){
			titles.push(pages[page].title);
		}

		// try to pick the image based on the biggest substring match
		var token = clean_token(get_token($link)); 

		var matches = titles.map(function(title){
			if (title == "File:Commons-logo.svg" || title == 'File:Question book-new.svg'){
				return [-1, -100, title];
			}

			return [lcs(title.toLowerCase(), token), -title.length, title]; //title.length for tie breaking
		});

		matches = matches.sort(function (a, b){
			if (a[0] < b[0]){
				return -1;
			}
			if (a[0] > b[0]){
				return 1;
			}
			if (a[1] < b[1]){
				return -1;
			}
			if (a[1] > b[1]){
				return 1;
			}
			return 0;
		});
	
		var best_match = matches[matches.length-1];
		if (best_match[0] > 3 || (token.length == best_match[0]) ){
			console.log('token ' + token + ' best_match ' + best_match + ' ' + matches);
			return best_match[2];
		}

		console.log('no good matches for token ' + token + ' matches were ' + matches);

		// no good match so just filter out the bad ones
		// titles = titles.filter(function(x){
		// 	// todo: pick the link that best matches the token
		// 	if (x == "File:Commons-logo.svg"){
		// 		return false;
		// 	}
		// 	var valid_exts = ['.png', '.jpg', '.gif'];
		// 	for (var i=0; i<valid_exts.length; i++){
		// 		var ext = valid_exts[i];

		// 		if (x.indexOf('-logo') > -1){
		// 			return false;
		// 		}

		// 		if (x.slice(x.length-4, x.length).toLowerCase() == ext){
		// 			return true;
		// 		}
		// 	}

		// 	return false;
		// });	

		// if (titles.length > 0){
		// 	return titles[0];
		// }	

		return false;
	}


	function get_token($link){
		var link = $link.attr('href');
		var tokens = link.split('/');
		return tokens[tokens.length-1];		
	}

	function get_api_link($link){
		return 'http://en.wikipedia.org/w/api.php?format=json&action=query&generator=images&titles=' + get_token($link);		
//		return 'http://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&titles=&pithumbsize=200' + get_token($link); //&pithumbsize=100;
	}

	// get the image files listed on the api link for the webpage
	$.getJSON(get_api_link($link), function(data){

		// if (get_token($link) == 'Beta_distribution'){
		// 	debugger;
		// }

		// move link from spawned to returned
		spawned.splice($link[0], 1);
		returned.push($link[0]);

		try{
			var img_name = pick_image(data.query.pages); //File:Conjugation.svg			
			if (!img_name){
				return;
			}
		}catch(e){
			console.log(e);
			return;
		}

		// scrape the image off of the wikipedia page for the image
		var img_url = 'http://en.wikipedia.org/wiki/' + img_name;
		$.get(img_url, function(data){

			var $img = $(data).find('#file img').first();

			var orig_width = parseFloat($img.attr('width'));
			var orig_height = parseFloat($img.attr('height'));

			if (orig_width < 50 || orig_height < 50){
				// do not replace -- it is likely metadata
				// todo: fix this silent fail
				return;
			}

			// todo: allow dragging on replacement images
			var replacement_size = 200;
			if (orig_width > orig_height){
				$img.width(replacement_size);
				$img.height(replacement_size*orig_height/orig_width);				
			}else{
				$img.height(replacement_size);
				$img.width(replacement_size*orig_width/orig_height);
			}

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

			var $cont = $('<span style="position:relative; display:inline-block;"></span>');
			var $label = $('<span class="replacement-label" style="position:absolute; display:block; background-color:rgba(0,0,0,0.8); color:white; white-space:nowrap; word-wrap: break-word;"></span>')
							.text($link.text())
							.css('max-width', $img.width());
			$label.css('top', $img.height()/2 - 10); //-2
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