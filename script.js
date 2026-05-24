//This first part is the code for drawing the gridlines for the canvas

let cellSize = 10;
let maxX = 1600/cellSize;
let maxY = 1200/cellSize;
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
ctx.strokeStyle = "rgba(0,0,0,0.2)";
ctx.lineWidth = 1;
for (let i = 0; i <= maxX; i++){
  ctx.beginPath();
  ctx.moveTo(i*cellSize, 0);
  ctx.lineTo(i*cellSize, 1200);
  ctx.stroke();
}
for (let j = 0; j <= maxY; j++){
  	ctx.beginPath();
	ctx.moveTo(0, j*cellSize);
    ctx.lineTo(1600, j*cellSize);
    ctx.stroke();
}

//This second part of code is for actually drawing the pixels

let isPainting = false;
c.addEventListener("mousedown", function(event)
{
  isPainting = true;
  addPixels(event);
});
c.addEventListener("mouseup", function(event){
  isPainting = false;
});
c.addEventListener("mousemove", function(event){
  if(isPainting){
    addPixels(event);
  }
});

let rect = c.getBoundingClientRect();

function addPixels(event){
    rect = c.getBoundingClientRect();
	  let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY -rect.top;
    let cellX = Math.floor(mouseX/cellSize);
    let cellY = Math.floor(mouseY/cellSize);
    let pixelX = cellX*cellSize;
    let pixelY = cellY*cellSize;
    ctx.fillStyle = "black";
    if(isPainting){
    ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
    }
}
