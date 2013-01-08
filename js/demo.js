var NUM_OF_VIEW = 9;
var SCORE_THRESHOLD = 1000;
var FRAME_RATE = 24;

function Position(x, y, side) {
	this.x = x;
	this.y = y;
	this.side = side;
}

function MarkerPosition(x, y) {
	this.x = x;
	this.y = y;
}

var VIDEO_POSITION = new Array(
	new Position(68, 25.5, "l"),
	new Position(61, 6.5, "l"),
	new Position(67, 44.8, "l"),
	new Position(69, 27, "r"),
	new Position(69.5, 51.8, "r"),
	new Position(59, 78, "r"),
	new Position(65, 5, "r"),
	new Position(56, 82, "l"),
	new Position(66, 63.5, "l"));

var MARDER_POSITION = new Array(
	new MarkerPosition(41.5, 41.7),
	new MarkerPosition(41, 33),
	new MarkerPosition(39, 58),
	new MarkerPosition(57, 50.5),
	new MarkerPosition(57, 63),
	new MarkerPosition(55.3, 70),
	new MarkerPosition(57.1, 38.3),
	new MarkerPosition(48.5, 60.5),
	new MarkerPosition(47, 58));

// All video objects
var g_video = [];
var g_cluster = [];
var g_face = [];

function resize() {
	var layout_wrapper = $('#layout-wrapper');
	layout_wrapper.width(layout_wrapper.children().width());
}

function GetInfoText(id, face, importance) {
	var state;
	if (importance > SCORE_THRESHOLD) state = 'Normal';
	else state = 'Off';
	var normal_score = importance/SCORE_THRESHOLD/2;
	return 'Camera #' + id + '</br>' +
			'Importance: ' + normal_score.toFixed(2) + '</br>' +
			'Face: ' + face.toFixed(2) + '</br> ' +
			'Status: ' + state;
}

$(function() {
	$('#btn-pause').css('display', 'none');
	var layout_wrapper = $('#layout-wrapper');
	var selected_video_bar = $('#selected-view-bar');
	for (var i=0; i<9; i++) {
		var x = VIDEO_POSITION[i].x;
		var y = VIDEO_POSITION[i].y;
		var side = VIDEO_POSITION[i].side;
		var video_panel = $('<div></div>');
		if (side == 'l') {
			video_panel.addClass('video-panel video-panel-left');
			video_panel.css('right', x+'%');
			video_panel.css('top', y+'%');
		} else {
			video_panel.addClass('video-panel video-panel-right');
			video_panel.css('left', x+'%');
			video_panel.css('top', y+'%');
		}
		var video_wrapper = $('<div></div>');
		video_wrapper.addClass('video-wrapper');
		var video = $('<video></video>');
		video.addClass('video');
		video.attr('src', 'video/' + i + '_2.mp4');
		video.attr('type', 'video/mp4');
		var info_panel = $('<div></div>');
		info_panel.addClass('info-panel');
		var info_txt = $('<p></p>');
		info_txt.addClass('panel-text');
		if (side == 'l') {
			info_txt.addClass('panel-text-left', 0);
		} else {
			info_txt.addClass('panel-text-right', 0);
		}
		info_txt.html(GetInfoText(i, 0, 0));
		var score_bar_outer = $('<div></div>');
		score_bar_outer.addClass('importance-bar-outer');
		if (side == 'l') {
			score_bar_outer.css('right', 0);
		} else {
			score_bar_outer.css('left', 0);
		}
		var score_bar_inner = $('<div></div>');
		score_bar_inner.addClass('importance-bar-inner importance-bar-inner-low');
		score_bar_inner.css('width', '0');
		score_bar_outer.append(score_bar_inner);

		info_panel.append(info_txt);
		video_wrapper.append(video);
		video_panel.append(video_wrapper);
		video_panel.append(info_panel);
		video_panel.append(score_bar_outer);
		layout_wrapper.append(video_panel);

		var selected_video = $('<video></video>').attr('class', 'selected-video');
		selected_video.attr('src', 'video/'+i+'_2.mp4');
		selected_video.attr('type', 'video/mp4');
		selected_video.css('display', 'none');
		selected_video_bar.append(selected_video);

		var marker = $('<div></div>').addClass('camera-marker');
		layout_wrapper.append(marker);
		marker.css('top', MARDER_POSITION[i].y+"%");
		marker.css('left', MARDER_POSITION[i].x+"%");

		g_video[i] = new Video(video_panel, selected_video.get(0), marker, i);
	}

	// load data
	load_data();
});

function fullscreen() {
	var element = document.getElementById('main-wrapper');
	if (element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if (element.webkitRequestFullScreen) {
		element.webkitRequestFullScreen();
	}
}

function Video(video_dom_obj, large_video, marker, id) {
	this.video = video_dom_obj.children('.video-wrapper').children('video').get(0);
	this.info_txt = video_dom_obj.children('.info-panel').children('p').get(0);
	this.score_bar = video_dom_obj.children('.importance-bar-outer').children('div');
	this.large_video = large_video;
	this.marker = marker;
	this._id = id;
	this.score_data = null;
	this.face_data = null;

	var self = this;
	var j_video = $(this.video);

	this.load = function(callback) {
		
		$.get('face/'+self._id+'_face.txt', function(data) {
				self.face_data = data.split('\n');
				if (callback) callback();
		}, false);

		$.get('score/'+self._id+'_score.txt', function(data) {
				self.score_data = data.split('\n');
				if (callback) callback();
		}, false);
	};

	this.loaded = function() {
		if (self.score_data && self.face_data) return true;
		else return false;
	};

	this.init = function() {
		self.video.addEventListener('timeupdate', self.update, false);
		self.update();
	};

	this.update = function() {
		var frame = Math.floor(self.video.currentTime * FRAME_RATE);
		var s = self.score_data[frame];
		var face_s = parseFloat(self.face_data[frame]);

		if (s > SCORE_THRESHOLD) {
			j_video.css("opacity", 1.0);
		} else {
			j_video.css("opacity", 0.3);
		}

		$(self.info_txt).html(GetInfoText(self._id, face_s, s));
		var normal_width = s / SCORE_THRESHOLD / 10;
		if (normal_width > 1) normal_width = 1;
		normal_width *= 100;
		$(self.score_bar).css('width', normal_width+'%');
		if (s > SCORE_THRESHOLD) {
			self.score_bar.attr('class', 'importance-bar-inner importance-bar-inner-high');
		} else {
			self.score_bar.attr('class', 'importance-bar-inner importance-bar-inner-low');
		}
		// $(self.face_score).html(face_s);

		var cluster = parseInt(g_cluster[frame][self._id]);

		switch (cluster) {
			case 0:
				marker.css("background-color", "red");
				marker.css("background-color", "red");
				break;
			case 1:
				marker.css("background-color", "yellow");
				break;
			case 2:
				marker.css("background-color", "green");
				break;
			case -1:
				marker.css("background-color", "#33b5e5");
				break;
			default:
				marker.css("background-color", "black");
		}
	};

	this.play = function() {
		self.video.play();
		self.large_video.play();
	};

	this.pause = function() {
		self.video.pause();
		self.large_video.pause();
	};
}

function load_data() {
	var callback = function() {
		if (!g_cluster.length) return;
		
		for (var i=0; i<NUM_OF_VIEW; i++) {
			if (!g_video[i].loaded()) return;
		}

		load_finish();
	};

	$.get('cluster/cluster.txt', function(data) {
			g_cluster = data.split("\n");
			for (var i=0, n=g_cluster.length; i<n; i++) {
				g_cluster[i] = g_cluster[i].trim().split(" ");
			}
			callback();
	}, false);

	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i].load(callback);
	}
}

function load_finish() {
	for (var i=0; i<NUM_OF_VIEW; i++) {
		g_video[i].init();
	}
	init_cluster();
}

function init_cluster() {
	g_video[0].video.addEventListener('timeupdate', function() {
		var frame = Math.floor(g_video[0].video.currentTime * FRAME_RATE);
		var max_score = new Array(0, 0, 0);
		var max_face_score = new Array(0, 0, 0);
		var max_index = new Array(0, 0, 0);
		var num_cluster = 0;
		for (var i=0; i<NUM_OF_VIEW; ++i) {
			var cluster = g_cluster[frame][i];
			if (cluster == -1) continue;
			if ((cluster + 1) > num_cluster) num_cluster = parseInt(cluster) + 1;
			var s = g_video[i].score_data[frame];
			var face_s = parseFloat(g_video[i].face_data[frame]);
			if (face_s > max_face_score[cluster]) {
				max_face_score[cluster]= face_s;
				max_index[cluster] = i;
			} else if ((max_face_score[cluster] == 0) && (s > max_score[cluster])) {
				max_score[cluster] = s;
				max_index[cluster] = i;
			}
		}

		// console.log(max_index);
		// console.log(num_cluster);
		for (var i=0; i<NUM_OF_VIEW; i++) {
			$(g_video[i].large_video).css('display', 'none');
		}
		var selected_video_bar = $('#selected-view-bar');
		for (var i=0; i<num_cluster; i++) {
			$(g_video[max_index[i]].large_video).css('display', 'inline-block');
			// $(g_video[max_index[i]].large_video).prependTo(selected_video_bar);
		}
	}, false);
}

function play() {
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i].play();
	}
	$('#btn-play').css('display', 'none');
	$('#btn-pause').css('display', 'inline');
}

function pause() {
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i].pause();
	}
	$('#btn-play').css('display', 'inline');
	$('#btn-pause').css('display', 'none');
}
