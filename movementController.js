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

var SPRITES = {};

function loadSprite(key, path)
{
	var image = new Image();
	image.src = './images/' + path + '.png';
	SPRITES[key] = image;
}

loadSprite('bass', 'instruments/bass');
loadSprite('drums', 'instruments/drums');
loadSprite('guitar', 'instruments/guitar');
loadSprite('keys', 'instruments/keys');
loadSprite('synth', 'instruments/synth');
loadSprite('voice', 'instruments/voice');

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
		var j = 0;
		while (j < 6)
		{
			var i = 0;
			while (i < 6)
			{
				var dx = 0;
				var dy = 0;
				if (i == 0)
					dx = 15;
				if (i == 1)
					dx = 11;
				if (i == 2)
				{
					dx = 8;
					dy = 2;
				}
				if (i == 3)
				{
					dx = 6;
					dy = 4;
				}
				if (i == 4)
				{
					dx = 5;
					dy = 7;
				}
				if (i == 5)
				{
					dx = 5;
					dy = 10;
				}

				if (j < 3)
					dy += j * 5;
				else
				{
					dx = -dx + 29;
					dy += (5 - j) * 5;
				} 
	
				this.TRIGGERS.push(
				{
					gizmo : 'instrument' + j,
					type : 'zone',
					x : j * 8 + dx - 4 | 0 ,
					y : 3 + i * 4 + dy,
					xs : 4, // out og 64
					ys : 4, // out of 48
					action : this.contorlInstrument,
					need : 3,
					parameter : [j, 5 - i]
				});
				++i;
			}
			++j;
		}	
	}

	this.ACTIVE = [0,0,0,0,0,0];

	this.initTriggers = function()
	{
		this.pushTriggers();

	}

	this.contorlInstrument = function(para)
	{
	//	console.log("Change Track to ", para[0], para[1]);
		tracks[para[0]].source.gain.value = .1 +  .15 * para[1];
		game.ACTIVE[para[0]] = para[1];
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
			trigger.action(trigger.parameter);
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

	this.PARTICLES = [];

	this.pushParticles = function()
	{
		var ctx = this.ctx;
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
			  	this.PARTICLES.push({
			  		x : x * dx + 1,
			  		y : y * dy + 1,
			  		s : dx
			  	});

			 	ctx.fillRect(x * dx + 1, y * dy + 1, dx - 2, dy -2);
			  }
			  ++y;
			}
			++x;
		}
	}

	this.renderParticles = function(ctx)
	{
		ctx.fillStyle = '#fff';
		var i = 0;
		while (i < this.PARTICLES.length)
		{
			var p = this.PARTICLES[i];
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2, true);
			p.y -= p.s;
			p.x += Math.random() * 10 - 5 | 0;
			ctx.globalAlpha = Math.random();
			ctx.fill();
			p.s--;
			if (p.s == 0)
			{
				this.PARTICLES.splice(i--, 1);
			}
			++i;
		}
	}

	this.renderIncredible = function(ctx)
	{
		var ctx = this.ctx;

		if (this.frameIntensity > 0)
		{
			this.pushParticles();
		}
		this.ctx.clearRect(0,0, this.WIDTH, this.HEIGHT);

		this.renderParticles(ctx);

		ctx.globalAlpha = .7;

		var dx = this.WIDTH / 64 | 0;
		var dy = this.HEIGHT / 48 | 0;
		ctx.fillStyle = '#0a8';
		ctx.strokeStyle = '#0a8';
		ctx.shadowColor="#0a8";
        ctx.shadowBlur = 10;  
		var i = 0;
		while (i < this.TRIGGERS.length)
		{
			var trigger = this.TRIGGERS[i];
			ctx.beginPath();
			ctx.arc(dx * (trigger.x + 2), dy * (trigger.y + 2), dx * trigger.xs / 2, 0, Math.PI * 2, true);
			if (trigger.active)
			{
				ctx.fill();		
			}
			else if (this.ACTIVE[trigger.parameter[0]] >= trigger.parameter[1])
			{
				ctx.globalAlpha = 0.3;
				ctx.fill();
				ctx.globalAlpha = .70;
			}
			else
			{
				ctx.stroke();
			}

			++i;
		}
		ctx.shadowBlur = 0; 
 
		ctx.drawImage(SPRITES['bass'], 11.5 * dx,  3*dy, 3*dx, 3*dx);
		ctx.drawImage(SPRITES['drums'], 19.5 * dx,  8*dy, 3*dx, 3*dx);
		ctx.drawImage(SPRITES['keys'], 27.5 * dx,  14*dy, 3*dx, 3*dx);
		ctx.drawImage(SPRITES['guitar'], 34.5 * dx,  13*dy, 3*dx, 3*dx);
		ctx.drawImage(SPRITES['synth'], 42.75 * dx,  8.5*dy, 2.5*dx, 2.5*dx);
		ctx.drawImage(SPRITES['voice'], 50.5 * dx,  3*dy, 2.5*dx, 2.5*dx);
 		ctx.globalAlpha = 1.0;
 		/*
		var dx = this.WIDTH / 64 | 0;
		var dy = this.HEIGHT / 48 | 0;

		ctx.fillStyle = '#F00';
		ctx.strokeStyle = '#F00';
		var i = 0;
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
		  */
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

		/*var i = 0;

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
		 */
	}

	this.render = function()
	{
		// Context to use !
		var ctx = this.ctx;

		if (this.frameIntensity > 0)
		{
			// Clear screen
			ctx.fillStyle = '#fff';
			ctx.globalAlpha = 0.2;
			ctx.fillRect(0,0,this.WIDTH, this.HEIGHT);
			ctx.globalAlpha = 1.0;
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
		
		game.renderIncredible();
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
