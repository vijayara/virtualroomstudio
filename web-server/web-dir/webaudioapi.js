	var context;
	var sine;
	var volume;
	var loadedBuffer;
	var source;
	var files;
	var soundName = '440';
	var hrirBuffer;
	var rawData;
	var hrir;
	var maxElvIndex = 50;


	window.addEventListener('load', init, false);


	//window.addEventListener('click', helloworld,false);
	function init() {
	  try {
	    // Fix up for prefixing
	    window.AudioContext = window.AudioContext||window.webkitAudioContext;
	    context = new AudioContext();
	  }
	  catch(e) {
	    alert('Web Audio API is not supported in this browser');
	  }



	  // Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
	  // Great success! All the File APIs are supported.
	} else {
	  alert('The File APIs are not fully supported in this browser.');
	}


	  

	  
	  volume = context.createGain();
	  volume.connect(context.destination)
	  //sine.type = 'custom';
	  //sine.start();
	  //sine.connect(context.destination);
	  


	  fetch('/' + soundName + '.wav')
	    // when we get the asynchronous response, convert to an ArrayBuffer
	    .then(response => response.arrayBuffer())
	    .then(buffer => {
	        // decode the ArrayBuffer as an AudioBuffer
	        context.decodeAudioData(buffer, decoded => {
	            // push the resulting sound to an array
	            loadedBuffer = decoded;
	        });
	    });

	    loadHRIR();
	 
	}



	function loadHRIR(){
		fetch('/hrirsub003.file')
	    .then(response => response.arrayBuffer())
	    .then(buffer => {
	        rawData = new Float64Array(buffer)	    
	        var ir = {};
	        ir.L = {};
	        ir.R = {};

	        hrirLength = 200;


	        var azimuths = [-80, -65, -55, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0,
                5, 10, 15, 20, 25, 30, 35, 40, 45, 55, 65, 80];

             var k = 0;
             var azi = 0;
             for(var i=0; i< azimuths.length ;i++){
             	azi = azimuths[i];
             	ir['L'][azi] = {};
             	ir['R'][azi] = {};
             



             for(var j=0; j<maxElvIndex;j++){
             	var elv = -45 + 5.625 * j;
                ir['L'][azi][elv] = rawData.subarray(k, k + hrirLength);
                k += hrirLength;
                ir['R'][azi][elv] = rawData.subarray(k, k + hrirLength);
                k += hrirLength;		
             }

         }

            hrir = ir            

	    });
	}

	function hrirPrint(){
		console.log(hrir);
	}

	function rawDataPrint(){
//		var floatdata = new Float32Array();
//		floatdata = ;
		console.log(rawData)
		console.log(rawData.length)
		//console.log(new Float32Array(rawData,0,rawData.length));
	}


	function playSound(){
		source = context.createBufferSource();
		source.buffer = loadedBuffer;
		source.connect(volume);
		source.start();
	}



	function startSin(){
		sine = context.createOscillator();
		sine.frequency.value = parseInt(document.getElementById('freq').value,10)
		sine.connect(volume);
		sine.start();
	}


	function stopSource(){
		source.stop();
	}

	function stopSin(){
		sine.stop();
		
	}

	function changeFrequency(){
		sine.frequency.value = parseInt(document.getElementById('freq').value,10)
	}

	function changeGain(){
		volume.gain.value = parseFloat(document.getElementById('gain').value)
	}






