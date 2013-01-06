var NUM_OF_VIEW = 9;
var SCORE_THRESHOLD = 300;

// All video objects
var g_video = [];

function fullscreen() {
	var element = document.getElementById('main_wrapper');
	if (element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if (element.webkitRequestFullScreen) {
		element.webkitRequestFullScreen();
	}
}

function Video(video_dom_obj, id) {
	this.video = video_dom_obj;
	this._id = id;
	this.score = null;
	var self = this;
	this.load_score = function(callback) {
		$.get('score/'+self._id+'_score.txt', function(data) {
				self.score = data.split('\n');
				callback(self);
			}, false);
	};

	this.is_loaded = function() {
		if (this.score) return true;
		else return false;
	};

	var j_video = $(this.video);
	this.video.addEventListener('timeupdate', function() {
		var frame = Math.floor(self.video.currentTime * 30);
		var s = self.score[frame];
		if (s > SCORE_THRESHOLD) {
			j_video.css("opacity", 1.0);
		} else {
			j_video.css("opacity", 0.3);
		}
	}, false);

	this.play = function() {
		self.video.play();
	};
}

function start_play() {
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i].play();
	}
}

function load_importance_data() {
	var callback = function(video) {
		var finish = true;
		for (var i=0; i<NUM_OF_VIEW; ++i) {
			if (!g_video[i].is_loaded()) finish = false;
		}
		if (finish) start_play();
	};
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i].load_score(callback);
	}
}

function start() {
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i] = new Video($('#video'+i).get(0), i);
	}
	load_importance_data();
}

function stop() {
	$('#video1')[0].pause();
}
