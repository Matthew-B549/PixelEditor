//This first part is the code for drawing the gridlines for the canvas

let cellSize = 10;
let maxX = 1600/cellSize;
let maxY = 1200/cellSize;

var draw = document.getElementById("drawCanvas");
var dctx = draw.getContext("2d");
var grid = document.getElementById("gridCanvas");
var gctx = grid.getContext("2d");

gctx.strokeStyle = "rgba(0,0,0,0.2)";
gctx.lineWidth = 1;

for (let i = 0; i <= maxX; i++){
  gctx.beginPath();
  gctx.moveTo(i*cellSize, 0);
  gctx.lineTo(i*cellSize, 1200);
  gctx.stroke();
}
for (let j = 0; j <= maxY; j++){
  gctx.beginPath();
	gctx.moveTo(0, j*cellSize);
  gctx.lineTo(1600, j*cellSize);
  gctx.stroke();
}

//This second part of code is for actually drawing the pixels

var drawButton = document.getElementById("drawButton");
var eraseButton = document.getElementById("eraseButton");
var colorPicker = document.getElementById("colorPicker");
var brushSlider = document.getElementById("brushSlider");
var clearButton = document.getElementById("clearButton");

let drawing = true; //if drawing is true, draw pixels. If drawing is false then erase pixels instead
let isPainting = false;
let currentColor = "#000000";
let brushSize = 1;

drawButton.addEventListener("click", function() {
  drawing = true;
});

eraseButton.addEventListener("click", function() {
  drawing = false;
});

colorPicker.addEventListener("input", function() {
  currentColor = this.value;
});

brushSlider.addEventListener("input", function() {
  brushSize = parseInt(this.value);
});

clearButton.addEventListener("click", function() {
  dctx.clearRect(0, 0, maxX*cellSize, maxY*cellSize);
});

draw.addEventListener("mousedown", function(event)
{
  isPainting = true;
  if(drawing){
  addPixels(event);
  }
  else if(!drawing){
    erasePixels(event);
  }
});
draw.addEventListener("mouseup", function(event){
  isPainting = false;
});
draw.addEventListener("mousemove", function(event){
  if(isPainting){
    if(drawing){
    addPixels(event);
    }
    else if(!drawing){
    erasePixels(event);
    }
  }
});

function addPixels(event){
    let rect = draw.getBoundingClientRect();
	  let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY -rect.top;
    let cellX = Math.floor(mouseX/cellSize);
    let cellY = Math.floor(mouseY/cellSize);
    let pixelX = cellX*cellSize;
    let pixelY = cellY*cellSize;
    dctx.fillStyle = currentColor;
    
    let radius = Math.floor(brushSize / 2);
    
    for(let dx = - radius; dx < brushSize - radius; dx++){
      for(let dy = - radius; dy < brushSize - radius; dy++){
        dctx.fillRect(pixelX + dx*cellSize, pixelY + dy*cellSize, cellSize, cellSize);
      }
    }
}

function erasePixels(event){
   let rect = draw.getBoundingClientRect();
	  let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;
    let cellX = Math.floor(mouseX/cellSize);
    let cellY = Math.floor(mouseY/cellSize);
    let pixelX = cellX*cellSize;
    let pixelY = cellY*cellSize;
    
    let radius = Math.floor(brushSize / 2);
    
    for(let dx = - radius; dx < brushSize - radius; dx++){
      for(let dy = -radius; dy < brushSize - radius; dy++){
          dctx.clearRect(pixelX + dx*cellSize, pixelY + dy*cellSize, cellSize, cellSize);
      }
    }
}
