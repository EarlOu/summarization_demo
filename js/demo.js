var NUM_OF_VIEW = 9;
var SCORE_THRESHOLD = 1000;

function Position(x, y, side) {
	this.x = x;
	this.y = y;
	this.side = side;
}

var VIDEO_POSITION = new Array(
	new Position(69, 22, "l"),
	new Position(62, 4.5, "l"),
	new Position(69, 44.8, "l"),
	new Position(69, 27, "r"),
	new Position(69.5, 51.8, "r"),
	new Position(56, 82, "l"),
	new Position(65, 5, "r"),
	new Position(59, 78, "r"),
	new Position(66, 63.5, "l"));

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
	return 'Camera #' + id + '</br>' +
			'Importance: ' + importance + '</br>' +
			'Face: ' + face + '</br> ' +
			'Status: ' + state;
}

$(function() {
	var layout_wrapper = $('#layout-wrapper');
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
		video.attr('src', 'video/' + i + '.mp4');
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

		info_panel.append(info_txt);
		video_wrapper.append(video);
		video_panel.append(video_wrapper);
		video_panel.append(info_panel);
		layout_wrapper.append(video_panel);

		g_video[i] = new Video(video_panel, i);
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

function Video(video_dom_obj, id) {
	this.video = video_dom_obj.children('.video-wrapper').children('video').get(0);
	this.info_txt = video_dom_obj.children('.info_panel').children('p').get(0);

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
		var frame = Math.floor(self.video.currentTime * 30);
		var s = self.score_data[frame];
		var face_s = parseFloat(self.face_data[frame]);

		if (s > SCORE_THRESHOLD) {
			j_video.css("opacity", 1.0);
		} else {
			j_video.css("opacity", 0.3);
		}

		// $(self.score).html(s);
		// $(self.face_score).html(face_s);

		var cluster = parseInt(g_cluster[frame][self._id]);

		switch (cluster) {
			case 0:
				j_video.css("border-color", "#cee4f2");
				break;
			case 1:
				j_video.css("border-color", "#4b7ba6");
				break;
			case 2:
				j_video.css("border-color", "#284659");
				break;
			case -1:
				j_video.css("border-color", "black");
				break;
			default:
				j_video.css("border-color", "black");
		}
	};

	this.play = function() {
		self.video.play();
	};

	this.pause = function() {
		self.video.pause();
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
	// init_cluster();
}

function init_cluster() {
	g_video[0].video.addEventListener('timeupdate', function() {
		var frame = Math.floor(g_video[0].video.currentTime * 30);
		var max_score = new Array(0, 0, 0);
		var max_face_score = new Array(0, 0, 0);
		var max_index = new Array(0, 0, 0);
		var num_cluster = 0;
		for (var i=0; i<NUM_OF_VIEW; ++i) {
			var cluster = g_cluster[frame][i];
			if (cluster == -1) continue;
			if ((cluster + 1) > num_cluster) num_cluster = cluster + 1;
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

		for (var i=0; i<NUM_OF_VIEW; i++) {
			$(g_video[i].video).parent().parent().css('border-color', 'black');
		}
		for (var i=0; i<num_cluster; i++) {
			$(g_video[max_index[i]].video).parent().parent().css('border-color', 'white');	
		}
	}, false);
}

function play() {
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i].play();
	}
}

function stop() {
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i].pause();
	}
}
