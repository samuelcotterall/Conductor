var context = new webkitAudioContext();

function play(){
  console.log("PLAY"); 
  $('canvas').show();
  for (var i = 0; i < tracks.length; i++) {
    var currentTrack = tracks[i];  
    currentTrack.source.noteOn(0);
    $("#intro").fadeOut();
  };

}

$("#play").on('click',function(){
  play();
  return false;
})

function ready(){
  
  for (var i = 0; i < tracks.length; i++) {

    var currentTrack = tracks[i];

    currentTrack.source = context.createBufferSource();
    currentTrack.source.buffer = currentTrack.buffer;    
    currentTrack.source.connect(context.destination);


  };  
  console.log("Tracks", tracks);

}

function loadTracks(trackNumber) {

  var request = new XMLHttpRequest(),
      i = trackNumber;
  request.open('GET', tracks[i].file, true);
  request.responseType = 'arraybuffer';
  
  request.onload = function() {
    
    context.decodeAudioData(request.response, function(buffer) {

      // Cache buffer in tracks array
      tracks[i].buffer = buffer;
      console.log('Loading track', i);

      if (i === (tracks.length - 1)) {
        $("#loading").fadeOut();
        ready();
      }

    }, onError);

  }
  onError = function() {
    console.log('IT IS FUCKING BROKEN');
  }

  request.send();

}

var tracks = [
  {
    "file": "../audio/1901/Bass.mp3"
  },
  {
    "file": "../audio/1901/Drums.mp3"
  },
  {
    "file": "../audio/1901/Keys.mp3"
  },
  {
    "file": "../audio/1901/RythmGuitar.mp3"
  },
  {
    "file": "../audio/1901/synth.mp3"
  },
  {
    "file": "../audio/1901/Voice.mp3"
  }
];

for (var i = 0; i < tracks.length; i++) {
  loadTracks(i);
};