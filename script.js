let cellSize = 10;
let canvasWidth = 1600;
let canvasHeight = 1200;
let maxX = canvasWidth / cellSize;
let maxY = canvasHeight / cellSize;

var draw = document.getElementById("drawCanvas");
var dctx = draw.getContext("2d");
var grid = document.getElementById("gridCanvas");
var gctx = grid.getContext("2d");

// Wrap grid drawing in a function so we can call it whenever the size changes
function drawGrid() {
  gctx.clearRect(0, 0, canvasWidth, canvasHeight);
  gctx.strokeStyle = "rgba(0,0,0,0.2)";
  gctx.lineWidth = 1;

  for (let i = 0; i <= maxX; i++) {
    gctx.beginPath();
    gctx.moveTo(i * cellSize, 0);
    gctx.lineTo(i * cellSize, canvasHeight);
    gctx.stroke();
  }
  for (let j = 0; j <= maxY; j++) {
    gctx.beginPath();
    gctx.moveTo(0, j * cellSize);
    gctx.lineTo(canvasWidth, j * cellSize);
    gctx.stroke();
  }
}

// Initial grid draw
drawGrid();

// Paint controls
var drawButton = document.getElementById("drawButton");
var eraseButton = document.getElementById("eraseButton");
var colorPicker = document.getElementById("colorPicker");
var brushSlider = document.getElementById("brushSlider");
var clearButton = document.getElementById("clearButton");
var undoButton = document.getElementById("undoButton");
var redoButton = document.getElementById("redoButton");
var exportButton = document.getElementById("exportButton");
var changeCanvasSize = document.getElementById("changeCanvasSize");
var canvasContainer = document.getElementById("canvasContainer");

let drawing = true;
let isPainting = false;
let currentColor = "#000000";
let brushSize = 1;

let undoStack = [];
let redoStack = [];

drawButton.addEventListener("click", function () {
  drawing = true;
});

eraseButton.addEventListener("click", function () {
  drawing = false;
});

colorPicker.addEventListener("input", function () {
  currentColor = this.value;
});

brushSlider.addEventListener("input", function () {
  brushSize = parseInt(this.value);
});

clearButton.addEventListener("click", function () {
  saveState();
  dctx.clearRect(0, 0, canvasWidth, canvasHeight);
});

exportButton.addEventListener("click", function () {
  let img = dctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
  let pixels = [];

  // Use dynamic canvas dimensions instead of hardcoded numbers
  for (let y = 0; y < canvasHeight; y += cellSize) {
    let row = [];
    for (let x = 0; x < canvasWidth; x += cellSize) {
      let index = (y * canvasWidth + x) * 4;
      let r = img[index];
      let g = img[index + 1];
      let b = img[index + 2];
      let a = img[index + 3];

      // Handle transparent pixels (default canvas background is transparent/black)
      if (a === 0) {
        r = 0;
        g = 0;
        b = 0;
      }

      let r5 = r >> 3; // 8 bit -> 5 bit
      let g6 = g >> 2; // 8 bit -> 6 bit
      let b5 = b >> 3; // 8 bit -> 5 bit

      let rgb565 = (r5 << 11) | (g6 << 5) | b5;
      let hex = "0x" + rgb565.toString(16).padStart(4, "0").toUpperCase();
      row.push(hex);
    }
    pixels.push(row);
  }

  let variableName = "image";
  let userInput = prompt(
    "Please enter what you would like to call this file",
    "image"
  );

  if (userInput !== null && userInput.trim() !== "") {
    variableName = userInput.trim().replace(/[^a-zA-Z0-9_]/g, "_");
  }

  // Dynamically generate the array matrix sizing based on actual grid rows/columns
  let arduino = `const uint16_t ${variableName}[${maxY}][${maxX}] = {\n`;
  for (let row of pixels) {
    arduino += "  {" + row.join(", ") + "},\n";
  }
  arduino += "};";

  let blob = new Blob([arduino], { type: "text/plain" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = variableName.trim() + ".h";
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
});

// Fixed Canvas Size changer
changeCanvasSize.addEventListener("click", function () {
  let width = prompt(
    "Please enter a width for the screen (e.g. 320): ",
    canvasWidth
  );
  let height = prompt(
    "Please enter a height for the screen (e.g. 240): ",
    canvasHeight
  );

  if (width && height) {
    canvasWidth = parseInt(width);
    canvasHeight = parseInt(height);
    maxX = canvasWidth / cellSize;
    maxY = canvasHeight / cellSize;

    // Update DOM element sizes
    canvasContainer.style.width = canvasWidth + "px";
    canvasContainer.style.height = canvasHeight + "px";

    grid.width = canvasWidth;
    grid.height = canvasHeight;
    draw.width = canvasWidth;
    draw.height = canvasHeight;

    // Redraw interface
    drawGrid();
    undoStack = [];
    redoStack = [];
  }
});

undoButton.addEventListener("click", function () {
  if (undoStack.length > 0) {
    const currentImage = dctx.getImageData(0, 0, canvasWidth, canvasHeight);
    redoStack.push(currentImage);
    const lastImage = undoStack.pop();
    dctx.putImageData(lastImage, 0, 0);
  }
});

redoButton.addEventListener("click", function () {
  if (redoStack.length > 0) {
    const currentImage = dctx.getImageData(0, 0, canvasWidth, canvasHeight);
    undoStack.push(currentImage);
    const redoImage = redoStack.pop();
    dctx.putImageData(redoImage, 0, 0);
  }
});

draw.addEventListener("mousedown", function (event) {
  saveState();
  isPainting = true;
  if (drawing) {
    addPixels(event);
  } else {
    erasePixels(event);
  }
});

draw.addEventListener("mouseup", function (event) {
  isPainting = false;
});

draw.addEventListener("mousemove", function (event) {
  if (isPainting) {
    if (drawing) {
      addPixels(event);
    } else {
      erasePixels(event);
    }
  }
});

function addPixels(event) {
  let rect = draw.getBoundingClientRect();
  let mouseX = event.clientX - rect.left;
  let mouseY = event.clientY - rect.top;
  let cellX = Math.floor(mouseX / cellSize);
  let cellY = Math.floor(mouseY / cellSize);
  let pixelX = cellX * cellSize;
  let pixelY = cellY * cellSize;
  dctx.fillStyle = currentColor;

  let radius = Math.floor(brushSize / 2);

  for (let dx = -radius; dx < brushSize - radius; dx++) {
    for (let dy = -radius; dy < brushSize - radius; dy++) {
      // Prevent drawing out of bounds
      if (
        cellX + dx >= 0 &&
        cellX + dx < maxX &&
        cellY + dy >= 0 &&
        cellY + dy < maxY
      ) {
        dctx.fillRect(
          pixelX + dx * cellSize,
          pixelY + dy * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }
}

function erasePixels(event) {
  let rect = draw.getBoundingClientRect();
  let mouseX = event.clientX - rect.left;
  let mouseY = event.clientY - rect.top;
  let cellX = Math.floor(mouseX / cellSize);
  let cellY = Math.floor(mouseY / cellSize);
  let pixelX = cellX * cellSize;
  let pixelY = cellY * cellSize;

  let radius = Math.floor(brushSize / 2);

  for (let dx = -radius; dx < brushSize - radius; dx++) {
    for (let dy = -radius; dy < brushSize - radius; dy++) {
      dctx.clearRect(
        pixelX + dx * cellSize,
        pixelY + dy * cellSize,
        cellSize,
        cellSize
      );
    }
  }
}

function saveState() {
  const image = dctx.getImageData(0, 0, canvasWidth, canvasHeight);
  undoStack.push(image);
  redoStack = [];
}
