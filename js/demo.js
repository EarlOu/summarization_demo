var NUM_OF_VIEW = 9;
var SCORE_THRESHOLD = 1000;

// All video objects
var g_video = [];
var g_cluster = [];
var g_face = [];

$(function() {
	for (var i=0; i<9; i++) {
		$('#main_wrapper').append(
		'<div id="video' + i + '" class="video_block">\
			<div class="video_wrapper"> \
                <video class="video" src="video/' + i + '.mp4" type="video/mp4"></video> \
            </div> \
            <p class="score">200</p> \
            <p class="face_score">200</p> \
   		</div>');
	}
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i] = new Video($('#video'+i), i);
	}
	load_data();
});

function fullscreen() {
	var element = document.getElementById('main_wrapper');
	if (element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if (element.webkitRequestFullScreen) {
		element.webkitRequestFullScreen();
	}
}

function Video(video_dom_obj, id) {
	this.video = video_dom_obj.children('.video_wrapper').children('video').get(0);
	this.score = video_dom_obj.children('p').get(0);
	this.face_score = video_dom_obj.children('p').get(1);
	this._id = id;
	this.score_data = null;
	this.face_data = null;
	var self = this;
	this.load_score = function(callback) {
		$.get('score/'+self._id+'_score.txt', function(data) {
				self.score_data = data.split('\n');
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
		var s = parseInt(self.score_data[frame]);
		var face_s = parseFloat(self.face_data[frame]);
		var j_video = $(self.video);

		if (s > SCORE_THRESHOLD) {
			j_video.css("opacity", 1.0);
		} else {
			j_video.css("opacity", 0.3);
		}

		$(self.score).html(s);
		$(self.face_score).html(face_s);

		var cluster = parseInt(g_cluster[frame][self._id]);

		switch (cluster) {
			case 0:
				j_video.css("border-color", "red");
				break;
			case 1:
				j_video.css("border-color", "blue");
				break;
			case 2:
				j_video.css("border-color", "green");
				break;
			case -1:
				j_video.css("border-color", "black");
				break;
			default:
				j_video.css("border-color", "yellow");
		}

	}, false);

	this.load_face = function() {
		$.get('face/'+self._id+'_face.txt', function(data) {
				self.face_data = data.split('\n');
		}, false);
	};

	this.play = function() {
		self.video.play();
	};

	this.pause = function() {
		self.video.pause();
	};
}

function load_cluster() {
	$.get('cluster/cluster.txt', function(data) {
			g_cluster = data.split("\n");
			for (var i=0, n=g_cluster.length; i<n; i++) {
				g_cluster[i] = g_cluster[i].trim().split(" ");
			}
	}, false);
}

function load_data() {
	var callback = function(video) {};
	load_cluster();
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i].load_score(callback);
		g_video[i].load_face();
	}
	cluster();
}

function cluster() {
	g_video[0].video.addEventListener('timeupdate', function() {
		var frame = Math.floor(g_video[0].video.currentTime * 30);
		var max_score = new Array(0, 0, 0);
		var max_face_score = new Array(0, 0, 0);
		var max_index = new Array(0, 0, 0);
		var num_cluster = 0;
		for (var i=0; i<NUM_OF_VIEW; ++i) {
			var cluster = parseInt(g_cluster[frame][i]);
			if (cluster == -1) continue;
			if ((cluster + 1) > num_cluster) num_cluster = cluster + 1;
			var s = parseInt(g_video[i].score_data[frame]);
			var face_s = parseFloat(g_video[i].face_data[frame]);
			if (face_s > max_face_score[cluster]) {
				max_face_score[cluster]= face_s;
				max_index[cluster] = i;
			} else if (max_face_score[cluster] == 0 && s > max_score[cluster]) {
				max_score[cluster] = s;
				max_index[cluster] = i;
			}
		}

		for (var i=0; i<NUM_OF_VIEW; ++i) {
			$(g_video[i].video).parent().parent().css('border-color', 'black');
		}
		for (var i=0; i<num_cluster; i++) {
			$(g_video[max_index[i]].video).parent().parent().css('border-color', 'white');	
		}
	}, false);
}

function start() {
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i].play();
	}
}

function stop() {
	for (var i=0; i<NUM_OF_VIEW; ++i) {
		g_video[i].pause();
	}
}
