/*

Author: Niroshan Vijayarasa 250 397
Date: 15.12.2018

This script test the Web Audio api. The convolution node is used for the testing. The idea is to have a single source feeded in a Convolution Node.


*/

var context;
var panner;
var counterAZ;
var comeback;
var rawData;
var hrir;
var hrirLength = 200;
var maxElvIndex = 50;
var azimuths = [-80, -65, -55, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0,
	5, 10, 15, 20, 25, 30, 35, 40, 45, 55, 65, 80];
window.addEventListener('load', init, false);





function init(){
	try {
	    // Fix up for prefixing
	    window.AudioContext = window.AudioContext||window.webkitAudioContext;
	    context = new AudioContext();
	}
	catch(e) {
		alert('Web Audio API is not supported in this browser');
	}

	var sourceNode = context.createMediaElementSource(document.getElementById("audioplayer"));
	sourceNode.channelCount = 1;
	loadHRIR();

	counterAZ = 0;

	panner = new Panner(sourceNode,context);

	comeback = false;
	initcanvas();
	canvas.onmousedown = myDown;
	canvas.onmouseup = myUp;

	
}

function loadHRIR(){
	fetch('/hrirsub003.file')
	.then(response => response.arrayBuffer())
	.then(buffer => {
		rawData = new Float64Array(buffer)	    
		var ir = {};
		ir.L = {};
		ir.R = {};



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


	}).catch(error => console.log(error));
}

function playMusic(){



	//var teta = parseInt(document.getElementById('angle').value,10);
	//var dist = parseFloat(document.getElementById('distance').value,10);
	//panner.update(teta,dist);

	audioplayer.play();


}

function pauseMusic(){
	audioplayer.pause();
}



function Panner(sourceNode,context){
	this.currentconv = new Convolver(sourceNode,context);
	this.targetconv = new Convolver(sourceNode,context) ;

//	this.targetconv.gain.gain =0;

	var az = -80;
	var el = 0;
	//this.currentconv.fillBuffer(az,el);
	this.currentconv.connect();

	
	//this.targetconv.fillBuffer(az,el);
	this.targetconv.connect();	


	this.update = function(teta,dist) {
		this.targetconv.fillBuffer(teta,dist);
		// start crossfading
		var crossfadeDuration = 25;
		this.targetconv.gain.gain.setValueAtTime(0, context.currentTime);
		this.targetconv.gain.gain.linearRampToValueAtTime(1,
			context.currentTime + crossfadeDuration / 1000);
		this.currentconv.gain.gain.setValueAtTime(1, context.currentTime);
		this.currentconv.gain.gain.linearRampToValueAtTime(0,
			context.currentTime + crossfadeDuration / 1000);
		// swap convolvers
		var t = this.targetconv;
		this.targetconv = this.currentconv;
		this.currentconv = t;
	}





}






function Convolver(sourceNode,context){
	this.convolver = context.createConvolver();
	this.convolver.normalize = true;
	this.gain = context.createGain();
	this.gain.gain.value = 1;

	this.distancegain = context.createGain();
	this.distancegain.gain.vale = 1;

	


	
	this.fillBuffer = function(teta, dist){

	var [azEst,elEst] = fromPolarToAZEL(teta);
	console.log(azEst + " , " +elEst)
	var [boundAzMin,boundAzMax] = findAZBound(azEst);

	var [interpol,w1,w2] = interpolationAZEL(azEst,elEst);
	console.log(interpol)
	var irLength = 200;
	// The impulse response is a AudioBuffer
	this.irBuff =  context.createBuffer(2, irLength, context.sampleRate);

	this.convolver.buffer = this.irBuff;


	var irBuffL = this.irBuff.getChannelData(0);
	var irBuffR = this.irBuff.getChannelData(1);

	for(var i=0;i<irLength;i++){
		//var r = 1/(i+1);
		if(interpol){
			irBuffL[i] = hrir['L'][boundAzMin][elEst][i]*w1 + hrir['L'][boundAzMax][elEst][i]*w2;
			irBuffR[i] = hrir['R'][boundAzMin][elEst][i]*w1 + hrir['R'][boundAzMax][elEst][i]*w2;			
		}else{
			irBuffL[i] = hrir['L'][azEst][elEst][i];
			irBuffR[i] = hrir['R'][azEst][elEst][i];
		}
	} 
	this.convolver.buffer = this.irBuff;

	this.distancegain.gain.value = dist;
}



	// Connect the nodes
	this.connect = function(){
		sourceNode.connect(this.distancegain)
		this.distancegain.connect(this.convolver);
		this.convolver.connect(this.gain);
		this.gain.connect(context.destination);

	}


}



// Utils functions

function fromPolarToAZEL(teta){ // in degree
	var el =0;
	var az = teta;
	if(Math.abs(teta)> 80){
		el = 180;
		az = 180*Math.sign(teta) - teta;
	}


	return [az,el];

} 



function interpolationAZEL(az,el){
	var interpol = false;
	var w1=0;
	var w2=0;
	if(azimuths.includes(az)){
		console.log("in azimut "+az);
		return [interpol,w1,w2];
	}else{
		interpol = true;
		if(Math.abs(az)>80){
			w1 = (100 - Math.abs(az))/(100-80);
			w2 = 1 - w1;			

			if(el == 180){
				// swap
				var temp = w1;
				w1 = w2;
				w2 = temp;

			}
		}else{
			var bounds = findAZBound(az);
			w1 = (az-bounds[0])/(bounds[1]-bounds[0]);
			w2 = 1-w2;
		}

	}
	return [interpol,w1,w2];
}


function findAZBound(az){
	var b = 0;
	for(var i=0;i<azimuths.length;i++){
		b =i;
		if(az<azimuths[b]){
			break;
		}
	}

	return [azimuths[b-1],azimuths[b]];
}


// -------------- GUI ----------------- //

var canvas ;
var ctx;
var WIDTH = 800;
var HEIGHT = 800;
var RADIOUS = 20;
var dragok = false;
var CX = WIDTH/2;
var CY = HEIGHT/2;
var x = CX;
var y = 50;



/*window.onload = function() {
init();
canvas.onmousedown = myDown;
canvas.onmouseup = myUp;

} */


function initcanvas() {
 canvas = document.getElementById("myCanvas");
 ctx = canvas.getContext("2d");
 return setInterval(draw, 10); // 10 milisecond
}


function rect(x,y,w,h) { // Sound Source
 ctx.beginPath();
 ctx.rect(x,y,w,h);
 ctx.closePath();
 ctx.fill();
}

function cercle(px,py,r){
 ctx.beginPath();
 ctx.arc(px,py,r,0,2*Math.PI);
 ctx.closePath();
 ctx.fill();
}


function clear() {
 ctx.clearRect(0, 0, WIDTH, HEIGHT);
}



function draw() {
 clear();
 
 // draw the canvas
 ctx.fillStyle = "#FAF7F8";
 rect(0,0,WIDTH,HEIGHT);

 // draw the cercle
 ctx.fillStyle = "#4da6ff"; // hell blue
 cercle(CX,CY, RADIOUS)


 // draw the rect
 ctx.fillStyle = "#444444";
 rect(x - 15, y - 15, 30, 30);




 
}

function teta(x,y){ // in degree
	var dx = x - CX;
	var dy = CY -y;
	var teta;
	teta = (-1)*( Math.atan2(dy, dx) * 180 / Math.PI) + 90;
	return Math.round(teta);

}

function distRatio(x,y){
	var dx = x - CX;
	var dy = CY -y;
	var r = Math.sqrt(dx*dx + dy*dy);

	return  (WIDTH/4)/r;
}

function myMove(e){
 if (dragok){
  x = e.pageX - canvas.offsetLeft;
  y = e.pageY - canvas.offsetTop;

  var t = teta(x,y);
  if(t>180){
  	t = t-360;
  }

  var dist = distRatio(x,y);
 
  panner.update(t,dist);

  //audioplayer.play();
  
 }
}

function myDown(e){
 if (e.pageX < x + 15 + canvas.offsetLeft && e.pageX > x - 15 +
 canvas.offsetLeft && e.pageY < y + 15 + canvas.offsetTop &&
 e.pageY > y -15 + canvas.offsetTop){
  x = e.pageX - canvas.offsetLeft;
  y = e.pageY - canvas.offsetTop;
  dragok = true;
  canvas.onmousemove = myMove;
 }
}

function myUp(){
 dragok = false;
 canvas.onmousemove = null;
}



