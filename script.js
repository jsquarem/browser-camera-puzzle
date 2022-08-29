let VIDEO = null;
let CANVAS = null;
let CONTEXT = null;
let SCALER = 0.4;
let SIZE = { x: 0, y: 0, width: 0, height: 0, rows: 3, columns: 3 };
let PIECES = [];
let SELECTED_PIECE = null;

function main() {
  CANVAS = document.getElementById('myCanvas');
  CONTEXT = CANVAS.getContext('2d');

  let promise = navigator.mediaDevices.getUserMedia({
    video: true,
  });
  promise
    .then(function (signal) {
      VIDEO = document.createElement('video');
      VIDEO.srcObject = signal;
      VIDEO.play();

      VIDEO.onloadeddata = function () {
        handleResize();
        //window.addEventListener('resize', handleResize);
        initializePieces(SIZE.rows, SIZE.columns);
        updateCanvas();
      };
    })
    .catch(function (err) {
      alert('Camera error: ' + err);
    });
}

function addEventListener() {
  CANVAS.addEventListener('mousedown', onMouseDown);
  CANVAS.addEventListener('mousemove', onMouseMove);
  CANVAS.addEventListener('mousedown', onMouseMove);
}

function onMouseDown(event) {
  SELECTED_PIECE = getPressedPiece(event);
  if (SELECTED_PIECE != null) {
    SELECTED_PIECE.offset = {
      x: event.x - SELECTED_PIECE.x,
      y: event.y - SELECTED_PIECE.y,
    };
  }
}

function onMouseMove(event) {
  if (SELECTED_PIECE != null) {
    SELECTED_PIECE.x = event.x - SELECTED_PIECE.offset.x;
    SELECTED_PIECE.y = event.y - SELECTED_PIECE.offset.y;
  }
}

function onMouseUp(event) {
  // TO-DO
}

function handleResize() {
  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;
  addEventListener();

  let resizer =
    SCALER *
    Math.min(
      window.innerWidth / VIDEO.videoWidth,
      window.innerHeight / VIDEO.videoHeight
    );
  SIZE.width = resizer * VIDEO.videoWidth;
  SIZE.height = resizer * VIDEO.videoHeight;
  SIZE.x = window.innerWidth / 2 - SIZE.width / 2;
  SIZE.y = window.innerHeight / 2 - SIZE.height / 2;
}

function updateCanvas() {
  CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);

  CONTEXT.globalAlpha = 0.5;
  CONTEXT.drawImage(VIDEO, SIZE.x, SIZE.y, SIZE.width, SIZE.height);
  CONTEXT.globalAlpha = 1;

  for (let i = 0; i < PIECES.length; i++) {
    PIECES[i].draw(CONTEXT);
  }
  window.requestAnimationFrame(updateCanvas);
}

function initializePieces(rows, columns) {
  SIZE.rows = rows;
  SIZE.columns = columns;

  PIECES = [];
  for (let i = 0; i < SIZE.rows; i++) {
    for (let j = 0; j < SIZE.columns; j++) {
      PIECES.push(new Piece(i, j));
    }
  }
}

function randomizePieces() {
  for (let i = 0; i < PIECES.length; i++) {
    let location = {
      x: Math.random() * (CANVAS.width - PIECES[i].width),
      y: Math.random() * (CANVAS.height - PIECES[i].height),
    };
    PIECES[i].x = location.x;
    PIECES[i].y = location.y;
  }
}

class Piece {
  constructor(rowIndex, columnIndex) {
    this.rowIndex = rowIndex;
    this.columnIndex = columnIndex;
    this.x = SIZE.x + (SIZE.width * this.columnIndex) / SIZE.columns;
    this.y = SIZE.y + (SIZE.height * this.rowIndex) / SIZE.rows;
    this.width = SIZE.width / SIZE.columns;
    this.height = SIZE.height / SIZE.rows;
  }
  draw(context) {
    context.beginPath();

    context.drawImage(
      VIDEO,
      (this.columnIndex * VIDEO.videoWidth) / SIZE.columns,
      (this.rowIndex * VIDEO.videoHeight) / SIZE.rows,
      VIDEO.videoWidth / SIZE.columns,
      VIDEO.videoHeight / SIZE.rows,
      this.x,
      this.y,
      this.width,
      this.height
    );

    context.rect(this.x, this.y, this.width, this.height);
    context.stroke();
  }
}
