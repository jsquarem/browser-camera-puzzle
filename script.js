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
  CANVAS.addEventListener('mouseup', onMouseUp);
  CANVAS.addEventListener('touchstart', onTouchStart);
  CANVAS.addEventListener('touchmove', onTouchMove);
  CANVAS.addEventListener('touchend', onTouchEnd);
}

function onTouchStart(event) {
  let location = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
  };
  onMouseDown(location);
}

function onTouchMove(event) {
  let location = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
  };
  onMouseMove(location);
}

function onTouchEnd() {
  onMouseUp(location);
}

function onMouseDown(event) {
  SELECTED_PIECE = getPressedPiece(event);
  if (SELECTED_PIECE != null) {
    const index = PIECES.indexOf(SELECTED_PIECE);
    if (index > -1) {
      PIECES.splice(index, 1);
      PIECES.push(SELECTED_PIECE);
    }
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

function onMouseUp() {
  if (SELECTED_PIECE.isClose()) {
    SELECTED_PIECE.snap();
  }
  SELECTED_PIECE = null;
}

function getPressedPiece(location) {
  for (let i = PIECES.length - 1; i >= 0; i--) {
    if (
      location.x > PIECES[i].x &&
      location.x < PIECES[i].x + PIECES[i].width &&
      location.y > PIECES[i].y &&
      location.y < PIECES[i].y + PIECES[i].height
    ) {
      return PIECES[i];
    }
  }
  return null;
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
    this.xCorrect = this.x;
    this.yCorrect = this.y;
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
  isClose() {
    if (
      distance(
        { x: this.x, y: this.y },
        { x: this.xCorrect, y: this.yCorrect }
      ) <
      this.width / 3
    ) {
      return true;
    }
    return false;
  }
  snap() {
    this.x = this.xCorrect;
    this.y = this.yCorrect;
  }
}

function distance(p1, p2) {
  return Math.sqrt(
    (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
  );
}
