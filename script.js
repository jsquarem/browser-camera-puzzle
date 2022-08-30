let VIDEO = null;
let CANVAS = null;
let CONTEXT = null;
let SCALER = 0.4;
let SIZE = { x: 0, y: 0, width: 0, height: 0, rows: 3, columns: 3 };
let PIECES = [];
let SELECTED_PIECE = null;
let START_TIME = null;
let END_TIME = null;

let POP_SOUND = new Audio('pop.mp3');
POP_SOUND.volume = 0.1;

let AUDIO_CONTEXT = new (AudioContext ||
  webkitAudioContext ||
  window.webkitAudioContext)();

let audioKeys = {
  DO: 261.6,
  RE: 293.7,
  MI: 329.6,
};

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
        updateGame();
      };
    })
    .catch(function (err) {
      alert('Camera error: ' + err);
    });
}

function setDifficulty() {
  let difficulty = document.getElementById('difficulty').value;
  switch (difficulty) {
    case 'easy':
      initializePieces(3, 3);
      break;
    case 'medium':
      initializePieces(5, 5);
      break;
    case 'hard':
      initializePieces(10, 10);
      break;
    case 'insane':
      initializePieces(40, 25);
      break;
  }
}

function restart() {
  START_TIME = new Date().getTime();
  END_TIME = null;
  randomizePieces();
  document.getElementById('menuItems').style.display = 'none';
}

function updateTime() {
  let now = new Date().getTime();
  if (START_TIME != null) {
    if (END_TIME != null) {
      document.getElementById('time').innerHTML = formatTime(
        END_TIME - START_TIME
      );
    } else {
      document.getElementById('time').innerHTML = formatTime(now - START_TIME);
    }
  }
}

function isComplete() {
  for (let i = 0; i < PIECES.length; i++) {
    if (PIECES[i].correct == false) {
      return false;
    }
  }
  return true;
}

function formatTime(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);
  let s = Math.floor(seconds % 60);
  let m = Math.floor((seconds % (60 * 60)) / 60);
  let h = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
  let formattedTime = h.toString().padStart(2, '0');
  formattedTime += ':';
  formattedTime += m.toString().padStart(2, '0');
  formattedTime += ':';
  formattedTime += s.toString().padStart(2, '0');
  return formattedTime;
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
    SELECTED_PIECE.correct = false;
  }
}

function onMouseMove(event) {
  if (SELECTED_PIECE != null) {
    SELECTED_PIECE.x = event.x - SELECTED_PIECE.offset.x;
    SELECTED_PIECE.y = event.y - SELECTED_PIECE.offset.y;
  }
}

function onMouseUp() {
  if (SELECTED_PIECE && SELECTED_PIECE.isClose()) {
    SELECTED_PIECE.snap();
    if (isComplete() && END_TIME == null) {
      let now = new Date().getTime();
      END_TIME = now;
      setTimeout(playMelody, 500);
    }
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

function updateGame() {
  CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
  CONTEXT.globalAlpha = 0.5;
  CONTEXT.drawImage(VIDEO, SIZE.x, SIZE.y, SIZE.width, SIZE.height);
  CONTEXT.globalAlpha = 1;
  for (let i = 0; i < PIECES.length; i++) {
    PIECES[i].draw(CONTEXT);
  }
  updateTime();
  window.requestAnimationFrame(updateGame);
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
  let count = 0;
  for (let i = 0; i < SIZE.rows; i++) {
    for (let j = 0; j < SIZE.columns; j++) {
      const piece = PIECES[count];
      if (i == SIZE.rows - 1) {
        piece.bottom = null;
      } else {
        const sign = Math.random() - 0.5 < 0 ? -1 : 1;
        piece.bottom = sign * (Math.random() * 0.4 + 0.3);
      }
      if (j == SIZE.columns - 1) {
        piece.right = null;
      } else {
        const sign = Math.random() - 0.5 < 0 ? -1 : 1;
        piece.right = sign * (Math.random() * 0.4 + 0.3);
      }
      if (i == 0) {
        piece.top = null;
      } else {
        piece.top = -PIECES[count - SIZE.columns].bottom;
      }
      if (j == 0) {
        piece.left = null;
      } else {
        piece.left = -PIECES[count - 1].right;
      }
      count++;
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
    PIECES[i].correct = false;
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
    this.correct = true;
  }
  draw(context) {
    context.beginPath();
    const size = Math.min(this.width, this.height);
    const neck = 0.05 * size;
    const tabWidth = 0.3 * size;
    const tabHeight = 0.3 * size;

    // Start in top left
    context.moveTo(this.x, this.y);
    // Draw to top right
    if (this.top) {
      context.lineTo(this.x + this.width * Math.abs(this.top) - neck, this.y);
      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.top) - neck,
        this.y - tabHeight * Math.sign(this.top) * 0.2,

        this.x + this.width * Math.abs(this.top) - tabWidth,
        this.y - tabHeight * Math.sign(this.top),

        this.x + this.width * Math.abs(this.top),
        this.y - tabHeight * Math.sign(this.top)
      );

      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.top) + tabWidth,
        this.y - tabHeight * Math.sign(this.top),

        this.x + this.width * Math.abs(this.top) + neck,
        this.y - tabHeight * Math.sign(this.top) * 0.2,

        this.x + this.width * Math.abs(this.top) + neck,
        this.y
      );
    }
    context.lineTo(this.x + this.width, this.y);
    // Draw to bottom right
    if (this.right) {
      context.lineTo(
        this.x + this.width,
        this.y + this.height * Math.abs(this.right) - neck
      );
      context.bezierCurveTo(
        this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
        this.y + this.height * Math.abs(this.right) - neck,

        this.x + this.width - tabHeight * Math.sign(this.right),
        this.y + this.height * Math.abs(this.right) - tabWidth,

        this.x + this.width - tabHeight * Math.sign(this.right),
        this.y + this.height * Math.abs(this.right)
      );
      context.bezierCurveTo(
        this.x + this.width - tabHeight * Math.sign(this.right),
        this.y + this.height * Math.abs(this.right) + tabWidth,

        this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
        this.y + this.height * Math.abs(this.right) + neck,

        this.x + this.width,
        this.y + this.height * Math.abs(this.right) + neck
      );
    }
    context.lineTo(this.x + this.width, this.y + this.height);
    // Draw to bottom left
    if (this.bottom) {
      context.lineTo(
        this.x + this.width * Math.abs(this.bottom) + neck,
        this.y + this.height
      );
      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.bottom) + neck,
        this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

        this.x + this.width * Math.abs(this.bottom) + tabWidth,
        this.y + this.height + tabHeight * Math.sign(this.bottom),

        this.x + this.width * Math.abs(this.bottom),
        this.y + this.height + tabHeight * Math.sign(this.bottom)
      );
      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.bottom) - tabWidth,
        this.y + this.height + tabHeight * Math.sign(this.bottom),

        this.x + this.width * Math.abs(this.bottom) - neck,
        this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

        this.x + this.width * Math.abs(this.bottom) - neck,
        this.y + this.height
      );
    }
    context.lineTo(this.x, this.y + this.height);
    // Draw to top left
    if (this.left) {
      context.lineTo(this.x, this.y + this.height * Math.abs(this.left) + neck);
      context.bezierCurveTo(
        this.x + tabHeight * Math.sign(this.left) * 0.2,
        this.y + this.height * Math.abs(this.left) + neck,

        this.x + tabHeight * Math.sign(this.left),
        this.y + this.height * Math.abs(this.left) + tabWidth,

        this.x + tabHeight * Math.sign(this.left),
        this.y + this.height * Math.abs(this.left)
      );
      context.bezierCurveTo(
        this.x + tabHeight * Math.sign(this.left),
        this.y + this.height * Math.abs(this.left) - tabWidth,

        this.x + tabHeight * Math.sign(this.left) * 0.2,
        this.y + this.height * Math.abs(this.left) - neck,

        this.x,
        this.y + this.height * Math.abs(this.left) - neck
      );
    }
    context.lineTo(this.x, this.y);

    context.save();
    context.clip();

    const scaledTabHeight =
      (Math.min(
        VIDEO.videoWidth / SIZE.columns,
        VIDEO.videoHeight / SIZE.rows
      ) *
        tabHeight) /
      size;

    context.drawImage(
      VIDEO,
      (this.columnIndex * VIDEO.videoWidth) / SIZE.columns - scaledTabHeight,
      (this.rowIndex * VIDEO.videoHeight) / SIZE.rows - scaledTabHeight,
      VIDEO.videoWidth / SIZE.columns + scaledTabHeight * 2,
      VIDEO.videoHeight / SIZE.rows + scaledTabHeight * 2,
      this.x - tabHeight,
      this.y - tabHeight,
      this.width + tabHeight * 2,
      this.height + tabHeight * 2
    );

    context.restore();
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
    this.correct = true;
    POP_SOUND.play();
  }
}

function distance(p1, p2) {
  return Math.sqrt(
    (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
  );
}

function playNote(key, duration) {
  let oscillator = AUDIO_CONTEXT.createOscillator();
  oscillator.frequency.value = key;
  oscillator.start(AUDIO_CONTEXT.currentTime);
  oscillator.stop(AUDIO_CONTEXT.currentTime + duration / 1000);

  let envelope = AUDIO_CONTEXT.createGain();
  oscillator.connect(envelope);
  oscillator.type = 'triangle';
  envelope.connect(AUDIO_CONTEXT.destination);
  envelope.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime);
  envelope.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1);
  envelope.gain.linearRampToValueAtTime(
    0,
    AUDIO_CONTEXT.currentTime + duration / 1000
  );

  setTimeout(function () {
    oscillator.disconnect();
  }, duration);
}

function playMelody() {
  playNote(audioKeys.MI, 300);
  setTimeout(function () {
    playNote(audioKeys.DO, 300);
  }, 300);
  setTimeout(function () {
    playNote(audioKeys.RE, 150);
  }, 450);
  setTimeout(function () {
    playNote(audioKeys.MI, 600);
  }, 600);
}
