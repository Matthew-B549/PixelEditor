//This first part is the code for drawing the gridlines for the canvas

let cellSize = 10;
let maxX = 1600/cellSize;
let maxY = 1200/cellSize;
let canvasWidth = 1600;
let canvasHeight = 1200;

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
var undoButton = document.getElementById("undoButton");
var redoButton = document.getElementById("redoButton");
var exportButton = document.getElementById("exportButton");

let drawing = true; //if drawing is true, draw pixels. If drawing is false then erase pixels instead
let isPainting = false;
let currentColor = "#000000";
let brushSize = 1;

let undoStack = [];
let redoStack = [];

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
  saveState();
  dctx.clearRect(0, 0, maxX*cellSize, maxY*cellSize);
});

exportButton.addEventListener("click", function() {
  let img = dctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
  let pixels = [];
  for(let y = 0; y < canvasHeight; y+=10){
    let row = [];
    for(let x = 0; x < canvasWidth; x+=10){
      let index = (y * canvasWidth + x) * 4;
      let r = img[index];
      let g = img[index + 1];
      let b = img[index + 2];
      let a = img[index + 3];
      let r5 = r >> 3; // 8 bit -> 5 bit
      let g6 = g >> 2; // 8 bit -> 6 bit
      let b5 = b >> 3; // 8 bit -> 5 bit
      
      let rgb565 = (r5 << 11) | (g6 << 5) | b5;
      
      let hex = "0x" + rgb565.toString(16).padStart(4, "0").toUpperCase();
      row.push(hex);
    }
    pixels.push(row);
  }
  
  let arduino = "const uint16_t image[120][160] = {\n";
  
  for(let row of pixels){
    arduino += " {" + row.join(", ") + "},\n";
  }
  
  arduino += "};";
  
  
  let blob = new Blob([arduino], {type: "text/plain"});
  
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = "image.h";
  a.click();
  
  URL.revokeObjectURL(url);
  
  // navigator.clipboard.writeText(arduino)
  // .then(() => alert("Copied Arduino array to clipboard!"))
  // .catch(err => alert("Copy failed: " + err));
  
});

undoButton.addEventListener("click", function() {
  const currentImage = dctx.getImageData(0, 0, canvasWidth, canvasHeight);
  redoStack.push(currentImage);
  if(undoStack.length != 0){
  const lastImage = undoStack.pop();
  dctx.putImageData(lastImage, 0, 0);
  }
});

redoButton.addEventListener("click", function() {
  const currentImage = dctx.getImageData(0, 0, canvasWidth, canvasHeight);
  undoStack.push(currentImage);
  if(redoStack.length != 0){
  const redoImage = redoStack.pop();
  dctx.putImageData(redoImage, 0, 0);
  }
});


draw.addEventListener("mousedown", function(event)
{
  saveState();
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

function saveState(){
  const image = dctx.getImageData(0, 0, canvasWidth, canvasHeight);
  undoStack.push(image);
  redoStack = [];
}
