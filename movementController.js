// Hacky, look away
window.requestAnimFrame = (function(){
return  window.requestAnimationFrame       ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function( callback ){
        window.setTimeout(callback, 1000 / 60);
      };
})();

window.URL = window.URL || window.webkitURL;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia || navigator.msGetUserMedia;

// hack OVER

function Game()
{
	this.WIDTH = 0;
	this.HEIGHT = 0;
	this.canvas = null;
	this.ctx = null;
	this.RUN = 0;

	this.fxCanvas = null;
	this.fxCtx = null;
	this.texture = null;

	this.videoCanvas = null;
	this.videoCtx = null;

	this.data = null;

	this.map = [];

	this.frameIntensity = 0;

	this.TRIGGERS = [];


	this.init = function()
	{

		this.WIDTH = window.innerWidth;
		this.HEIGHT = window.innerHeight;
		this.canvas = document.createElement('canvas');
		this.canvas.style.width = this.WIDTH;
		this.canvas.style.height = this.HEIGHT;
		this.canvas.style.position = 'absolute';
		this.canvas.style.margin = '0px';
		this.canvas.style.top = '0px';
		this.canvas.style.left = '0px';
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		document.body.appendChild(this.canvas);
		this.ctx = this.canvas.getContext('2d');

		this.videoCanvas = document.createElement('canvas');
		this.videoCanvas.width = 64;
		this.videoCanvas.height = 48 * 2;
		this.videoCtx = this.videoCanvas.getContext('2d');


		// Movement analysis MAP
		this.map = [];
		var i = 0;
		while (i < 64)
		{
			this.map[i] = [];
			var j = 0;
			while (j < 48)
			{
				this.map[i][j] = 0;
				++j;
			}
			++i;
		}

		this.initTriggers();
	}

	this.start = function(soundPlayer)
	{
        console.log("game start");
		this.RUN = 1;
		this.fxCanvas = fx.canvas();
		this.texture = this.fxCanvas.texture(this.videoCanvas);
		this.run();
	}

	this.stop = function()
	{
		this.RUN = 0;
		this.soundPlayer.pause();
	}

	this.analyzeCurrentFrame = function()
	{
		this.videoCtx.drawImage(userMedia.video,0,0, 64, 48);
		this.texture.loadContentsOf(this.videoCanvas);
	    this.fxCanvas.draw(this.texture);
		this.fxCanvas.mirror();
		this.fxCanvas.move(0.2);
		this.fxCanvas.update();
	    this.videoCtx.drawImage(this.fxCanvas, 0, 0);
	    this.compute();

	    this.videoCtx.drawImage(userMedia.video, 0, 48, 64, 48);
	}

	this.pushTriggers = function()
	{
		var i = 0;
		while (i < 4)
		{
			this.TRIGGERS.push(
			{
				gizmo : 'instrument1',
				type : 'zone',
				x : 0,
				y : 24 + i * 6,
				xs : 6, // out og 64
				ys : 6, // out of 48
				action : this.logHello,
				need : 5,
				parameter : 1
			});
			++i;
		}	

		i = 0;
		while (i < 4)
		{
			this.TRIGGERS.push(
			{
				gizmo : 'instrument2',
				type : 'zone',
				x : 6,
				y : 18 + i * 6,
				xs : 6, // out og 64
				ys : 6, // out of 48
				action : this.logHello,
				need : 6,
				parameter : 1
			});
			++i;
		}

		i = 0;
		while (i < 4)
		{
			this.TRIGGERS.push(
			{
				gizmo : 'instrument3',
				type : 'zone',
				x : 12,
				y : 12 + i * 6,
				xs : 6, // out og 64
				ys : 6, // out of 48
				action : this.logHello,
				need : 7,
				parameter : 1
			});
			++i;
		}

		i = 0;
		while (i < 4)
		{
			this.TRIGGERS.push(
			{
				gizmo : 'instrument4',
				type : 'zone',
				x : 18,
				y : 6 + i * 6,
				xs : 6, // out og 64
				ys : 24, // out of 48
				action : this.logHello,
				need : 7,
				parameter : 1
			});
			++i;
		}

		i = 0;
		while (i < 4)
		{
			this.TRIGGERS.push(
			{
				gizmo : 'instrument1',
				type : 'zone',
				x : 24,
				y : i * 6,
				xs : 6, // out og 64
				ys : 24, // out of 48
				action : this.logHello,
				need : 8,
				parameter : 1
			});
			++i;
		}

		var i = 0;
		while (i < 12)
		{
			this.TRIGGERS.push(
			{
				gizmo : 'rythme' + i,
				type : 'zone',
				x : 32,
				y : i * 4,
				xs : 16, // out og 64
				ys : 4, // out of 48
				action : this.logHello,
				need : 5,
				parameter : 1
			});	
			++i;
		}

		var i = 4;
		while (i < 12)
		{
			this.TRIGGERS.push(
			{
				gizmo : 'rythme' + i,
				type : 'zone',
				x : i * 4 + 16,
				y : 32,
				xs : 4, // out og 64
				ys : 32, // out of 48
				action : this.logHello,
				need : 5,
				parameter : 1
			});	
			++i;
		}
		

	}

	this.logHello = function()
	{
		console.log('Hello')
	}

	this.initTriggers = function()
	{
		this.pushTriggers();

	}

	this.runZone = function(trigger)
	{
		var intensityInTrigger = 0;
		var x = trigger.x;
		while (x < trigger.x + trigger.xs)
		{
			var y = trigger.y;
			while(y < trigger.y + trigger.ys)
			{
				if (this.map[x][y])
					intensityInTrigger++;
				++y;
			}
			++x;
		}

		if (intensityInTrigger > trigger.need)
		{
			trigger.action();
			trigger.active = 1;
		}	
		else
		{
			trigger.active = 0;
		}
	}

	this.runTrigger = function()
	{
		var i = 0;
		while (i < this.TRIGGERS.length)
		{
			var p = this.TRIGGERS[i];
			if (p.type === 'zone')
			{
				this.runZone(p);
			}
			++i;
		}
	}

	this.analyze = function(now)
	{
		this.analyzeCurrentFrame();
		// Did something happen
		if (this.frameIntensity)
		{
			this.runTrigger();
		}
	}

	// WIP WIP : Do some smart Stuff here
	this.compute = function()
	{
		this.data = this.videoCtx.getImageData(0,0,64,48).data;
		var data = this.data;

		var intensity = 0;
		var x = 0;
		var hash = 0;
		while (x < 64)
		{
			var y =0;
			while (y < 48)
			{
			  if (data[x * 4 + y * 64 * 4] > 120)
			  {
			    intensity++;
			    this.map[x][y] = 6;
			  	hash += x * y;
			  }
			  else
			  	this.map[x][y] = 0;
			  ++y;
			}
			++x;
		}
		this.frameIntensity = intensity;
	}

	this.renderDebug = function(ctx)
	{
		ctx.fillStyle = '#000';
		var x = 0;
		var dx = this.WIDTH / 64 | 0;
		var dy = this.HEIGHT / 48 | 0;
		while (x < 64)
		{
			var y =0;
			while (y < 48)
			{
			  if (this.map[x][y])
			  {
			 	ctx.fillRect(x * dx + 1, y * dy + 1, dx - 2, dy -2);
			  }
			  ++y;
			}
			++x;
		}

		var i = 0;

		ctx.fillStyle = '#F00';
		ctx.strokeStyle = '#F00';
		while (i < this.TRIGGERS.length)
		{
			var trigger = this.TRIGGERS[i];
			if (trigger.active)
			{
				if (trigger.type === 'zone')
				{
					ctx.fillRect(dx * trigger.x, dy * trigger.y, dx * trigger.xs, dy * trigger.ys);		
				}
			}
			else
			{
				if (trigger.type === 'zone')
				{
					ctx.strokeRect(dx * trigger.x, dy * trigger.y, dx * trigger.xs, dy * trigger.ys);		
					ctx.fillText(trigger.gizmo, trigger.x * dx + 10, trigger.y * dy + 20);
				}
			}
			++i;
		}
	}

	this.render = function()
	{
		// Context to use !
		var ctx = this.ctx;


		if (this.frameIntensity > 0)
		{
			// Clear screen
			ctx.fillStyle = '#fff';
			ctx.fillRect(0,0,this.WIDTH, this.HEIGHT);

			this.renderDebug(ctx);
		}
	}

	// Game loo[p] Here
	this.run = function(delta)
	{
		var now = new Date().getTime();
		//console.log(delta);
		// FIRTS Analyse movement (if something new)
		game.analyze();
		
		// SECOND  Manage visualisation
		
		game.render();
		requestAnimFrame(game.run);
	}
}
var game = new Game();

function UserMedia()
{
	this.hasGetUserMedia = function()
	{
	  	// Note: Opera is unprefixed.
	  	return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
	            navigator.mozGetUserMedia || navigator.msGetUserMedia);
	}

	this.onFailSoHard = function(e)
	{
		console.log('Reeeejected!', e);
	};

	this.video = document.createElement('video');

	this.init = function()
	{
		if (navigator.getUserMedia)
		{
			navigator.getUserMedia(
				{audio: true, video: true},
				function(stream)
				{
					console.log('Here we GO!');
					userMedia.video.src = window.URL.createObjectURL(stream);
		    		userMedia.video.play();
		    		game.start();
		  		},
		  		this.onFailSoHard
		  	);
		}
		else
		{
	  		alert('fail');
		}
	}
}
var userMedia = new UserMedia();

function launchGame()
{
	game.init();
    userMedia.init();
}
