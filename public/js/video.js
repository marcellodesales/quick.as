$(function() {

	// This is an initial version and pretty basic needs a lot more testing + cleanup
	// The Player has been kept pretty basic at this stage (volume for example is on or off)
	$('video').videoPlayer();

	$("a.embed").on("click", function() {
		if ($("a.embed textarea").length === 0) {
			$("a.embed span").hide();
			$(this).append("<textarea><iframe src='http://" + window.location.host + "/embed" + window.location.pathname + "' scrolling='no' frameborder='0' width='100%'></iframe><script>!function(){function e(){var e=document.getElementsByName('quickcast')
for(var n in e){var t=e[n].offsetWidth
e[n].height=t/1.6+80+'px'}}e(),window.onresize=e}()</script></textarea>");
		}

		return false;
	});
	
});

(function($) {

	$.fn.videoPlayer = function(options) {

		// Handle mobile devices
		if (/mobile/i.test(navigator.userAgent)) {
			var padding = $(".container").css('padding-left').replace('px','');
			$("video").attr("controls", true)
				.attr("width", window.screen.width - (parseInt(padding)*2))
				.attr("height", (window.screen.width - (parseInt(padding)*2)) / 1.6);

			return;
		}

		// If we get this far then reset the video size
		$('video').css({ "min-width":"100%","width":"100%","height":"auto"});
		
		return this.each(function() {	
			
			$(this)[0].load();
			
			$(this)[0].addEventListener('loadeddata', function() {

				var $this = $(this);

				$this.wrap('<div class="video"></div>');
				
				var $that = $this.parent('.video');
				
				// The Structure of our video player
				{
					$('<div class="play-button"></div>'
					     + '<div class="player">'
					     + '<div class="pause-button"></div>'
					     + '<div class="progress">'
					       + '<div class="progress-bar">'
					         + '<div class="button-holder">'
					           + '<div class="progress-button"> </div>'
					         + '</div>'
					       + '</div>'
					     + '</div>'
					      + '<div class="time">'
					         + '<span class="ctime">00:00</span>' 
					         + '<span class="stime"> / </span>'
					         + '<span class="ttime">00:00</span>'
					       + '</div>'
					     + '<div class="volume">'
					       + '<div class="volume-holder">'
					         + '<div class="volume-bar-holder">'
					           + '<div class="volume-bar">'
					             + '<div class="volume-button-holder">'	
					               + '<div class="volume-button"> </div>'
					             + '</div>'
					           + '</div>'
					         + '</div>'
					       + '</div>'
					       + '<div class="volume-icon v-change-0">'
					         + '<span> </span>'
					       + '</div>'
					     + '</div>'
					     + '<div class="fullscreen"> '
					       + '<a href="#"> </a>'
					     + '</div>'
					   + '</div>').appendTo($that);
				}
				
				// Video information
				var $spc = $(this)[0], // Specific video
					$duration = $spc.duration, // Video Duration
					$volume = $spc.volume, // Video volume
					$originalTitle = document.title, // Page title (original)
					currentTime;
				
				// Some other misc variables to check when things are happening
				var $mclicking = false, 
				    $vclicking = false, 
				    $vidhover = false,
				    $volhover = false, 
				    $playing = false, 
				    $drop = false,
				    $begin = false,
				    $draggingProgess = false,
				    $storevol,	
				    x = 0, 
				    y = 0, 
				    vtime = 0, 
				    updProgWidth = 0, 
				    volume = 0;
				    
				// Setting the width, etc of the player
				var $volume = $spc.volume;
				
				// So the user cant select text in the player
				$that.bind('selectstart', function() { return false; });
						
				// Set some widths
				var progWidth = $that.find('.progress').width();

				var bufferLength = function() {
				
					// The buffered regions of the video
					var buffered = $spc.buffered;
					
					// Rest all buffered regions everytime this function is run
					$that.find('[class^=buffered]').remove();
					
					// If buffered regions exist
					if(buffered.length > 0) {
						// The length of the buffered regions is i
						var i = buffered.length;
							
						while(i--) {
							// Max and min buffers
							$maxBuffer = buffered.end(i);
							$minBuffer = buffered.start(i);
									
							// The offset and width of buffered area				
							var bufferOffset = ($minBuffer / $duration) * 100;			
							var bufferWidth = (($maxBuffer - $minBuffer) / $duration) * 100;
											
							// Append the buffered regions to the video
							$('<div class="buffered"></div>').css({"left" : bufferOffset+'%', 'width' : bufferWidth+'%'}).appendTo($that.find('.progress'));
						}
					}
				} 
				
				// Run the buffer function
				bufferLength();
				
				// The timing function, updates the time.
				var timeUpdate = function($ignore) {
					
					// The current time of the video based on progress bar position
					var time = Math.round(($('.progress-bar').width() / progWidth) * $duration);
					
					// The 'real' time of the video
					var curTime = $spc.currentTime;
					
					// Seconds are set to 0 by default, minutes are the time divided by 60
					// tminutes and tseconds are the total mins and seconds.
					var seconds = 0,
						minutes = Math.floor(time / 60),
						tminutes = Math.round($duration / 60),
						tseconds = Math.round(($duration) - (tminutes*60));
					
					// If time exists (well, video time)
					if(time) {
						// seconds are equal to the time minus the minutes
						seconds = Math.round(time) - (60*minutes);
						
						// So if seconds go above 59
						if(seconds > 59) {
							// Increase minutes, reset seconds
							seconds = Math.round(time) - (60*minutes);
							if(seconds == 60) {
								minutes = Math.round(time / 60); 
								seconds = 0;
							}
						}
						
					} 
					
					// Updated progress width
					updProgWidth = (curTime / $duration) * progWidth;
					
					// Set a zero before the number if its less than 10.
					if(seconds < 10) { seconds = '0'+seconds; }
					if(tseconds < 10) { tseconds = '0'+tseconds; }
					
					// A variable set which we'll use later on
					//if($ignore != true) {
						$that.find('.progress-bar').css({'width' : updProgWidth+'px'});

						if ($spc.currentTime > 0)
							$that.find('.progress-button').css({'left' : (updProgWidth-$that.find('.progress-button').width()-15)+'px'});
						else
							$that.find('.progress-button').css({'left' : (updProgWidth-$that.find('.progress-button').width()-5)+'px'});
					//}
					
					// Update times
					$that.find('.ctime').html(minutes+':'+seconds) 
					$that.find('.ttime').html(tminutes+':'+tseconds);
				
					// If playing update buffer value
					if($spc.currentTime > 0 && $spc.paused == false && $spc.ended == false)
						bufferLength();

					// Update the page title
					if ($playing)
						document.title = 'Playing ' + minutes+':'+seconds + ' / ' + tminutes+':'+tseconds;
					else if ($spc.currentTime > 0)
						document.title = 'Paused ' + minutes+':'+seconds + ' / ' + tminutes+':'+tseconds;
					else
						document.title = $originalTitle;
				}
				
				// Run the timing function twice, once on init and again when the time updates.
				timeUpdate();

				$spc.addEventListener('timeupdate', timeUpdate);

				// Window resize to adjust the video
				$(window).resize(function() {

					if ($spc.currentTime >= $duration)
						$spc.currentTime = 0;

					progWidth = $that.find('.progress').width();

					timeUpdate();

					$that.find('.progress-bar').css({'width' : updProgWidth+'px'});

					if ($spc.currentTime > 0)
						$that.find('.progress-button').css({'left' : (updProgWidth-$that.find('.progress-button').width()-15)+'px'});
					else
						$that.find('.progress-button').css({'left' : (updProgWidth-$that.find('.progress-button').width()-5)+'px'});

					bufferLength();

				});
								
				// When the user clicks play, bind a click event	
				$that.find('.play-button, .pause-button').on('click', function() {
					
					// Set up a playing variable
					if($spc.currentTime > 0 && $spc.paused == false && $spc.ended == false) {
						$playing = false;
					} else { 
						$playing = true; 
					}
					
					// If playing, etc, change classes to show pause or play button
					if($playing == false) {
						$('.play-button, .pause-button').removeClass("playing");
						$spc.pause();
						bufferLength();
					} else {
						$('.play-button, .pause-button').addClass("playing");
						$begin = true;
						$spc.play();
					}		
					
				});
				
				// Bind a function to the progress bar so the user can select a point in the video
				$that.find('.progress').bind('mousedown', function(e) {
					// Progress bar is being clicked
					$mclicking = true;
					
					// If video is playing then pause while we change time of the video
					if($playing == true) {
						$spc.pause();
					}
					
					// The x position of the mouse in the progress bar 
					x = e.pageX - $that.find('.progress').offset().left;
					
					// Update current time
					currentTime = (x / progWidth) * $duration;
					
					$spc.currentTime = currentTime;
				});
				
				// For usability purposes then bind a function to the body assuming that the user has clicked mouse
				// down on the progress bar or volume bar
				$('body, html').bind('mousemove', function(e) {
					// For the progress bar controls
					if($mclicking == true) {	
						
						// Dragging is happening
						$draggingProgress = true;
						// The thing we're going to apply to the CSS (changes based on conditional statements);
						var progMove = 0;
						// Width of the progress button (a little button at the end of the progress bar)
						var buttonWidth = $that.find('.progress-button').width();
						
						// Updated x posititon the user is at
						x = e.pageX - $that.find('.progress').offset().left;
						
						if(x-15 < 0) { // If x is less than 0 then move the progress bar 0px
							progMove = 0;
							$spc.currentTime = 0;
						} 
						else if(x > progWidth) { // If x is more than the progress bar width then set progMove to progWidth
							$spc.currentTime = $duration;
							progMove = progWidth;	
						}
						else { // Otherwise progMove is equal to the mouse x coordinate
							progMove = x;
							currentTime = (x / progWidth) * $duration;
							$spc.currentTime = currentTime;	
						}
						
						// Change CSS based on previous conditional statement
						$that.find('.progress-bar').css({'width' : progMove+'px'});

						if ($spc.currentTime > 0)
							$that.find('.progress-button').css({'left' : (progMove-buttonWidth-15)+'px'});
						else
							$that.find('.progress-button').css({'left' : (progMove-buttonWidth-5)+'px'});
					}	
				});
				
				// When the video ends the play button becomes a pause button
				$spc.addEventListener('ended', function() {	
					$playing = false;



					// If the user is not dragging
					if($draggingProgress == false) {
						$('.play-button, .pause-button').removeClass("playing");
					}
				});
				
				// If the user clicks on the volume icon, mute the video, store previous volume, and then
				// show previous volume should they click on it again.
				$that.find('.volume').bind('mousedown', function() {					
					$volume = $spc.volume; // Update volume
					
					// If volume is undefined then the store volume is the current volume
					if(typeof $storevol == 'undefined') {
						 $storevol = $spc.volume;
					}
					
					// If volume is more than 0
					if($volume > 0) {
						// then the user wants to mute the video, so volume will become 0
						$spc.volume = 0; 
						$volume = 0;
						$that.find('.volume-bar').css({'height' : '0'});
						$that.find('.volume').addClass("off");
					}
					else {
						// Otherwise user is unmuting video, so volume is now store volume.
						$spc.volume = $storevol;
						$volume = $storevol;
						$that.find('.volume-bar').css({'height' : ($storevol*100)+'%'});
						$that.find('.volume').removeClass("off");
					}
				});
				
				
				// If the user lets go of the mouse, clicking is false for both volume and progress.
				// Also the video will begin playing if it was playing before the drag process began.
				// We're also running the bufferLength function
				$('body, html').bind('mouseup', function(e) {
					$mclicking = false;
					$vclicking = false;
					$draggingProgress = false;
					
					if($playing == true) {	
						$spc.play();
					}
					
					bufferLength();
				});
				
				// Check if fullscreen supported. If it's not just don't show the fullscreen icon.
				if(!$spc.requestFullscreen && !$spc.mozRequestFullScreen && !$spc.webkitRequestFullScreen) {
					$('.fullscreen').hide();
				}
				
				// Requests fullscreen based on browser.
				$('.fullscreen').on("click", function() {
				
					if ($spc.requestFullscreen) {
						$spc.requestFullscreen();
					}
				
					else if ($spc.mozRequestFullScreen) {
						$spc.mozRequestFullScreen();
					}
					
					else if ($spc.webkitRequestFullScreen) {
						$spc.webkitRequestFullScreen();
					}
				
				});
				
			});
			
		});
	
	}
	
})(jQuery);