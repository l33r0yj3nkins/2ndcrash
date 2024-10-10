const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

let currentMultiplier = 1.0;
let crashPoint = 0;
let gameRunning = false;
let countdownRunning = false;
let countdownTime = 10;
let gameStarted = false;
let houseEdge = 0.05;
let increment = 0.01;
let prizePool = 1000;
let housePool = 0;
let jackpotPool = 0;
const players = {};

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/admin', (req, res) => {
  res.render('admin_login');
});

app.post('/admin', (req, res) => {
  if (req.body.password === 'adminpassword') {
    res.redirect('/admin/dashboard');
  } else {
    res.send('Incorrect password');
  }
});

app.get('/admin/dashboard', (req, res) => {
  res.render('admin_dashboard', { houseEdge, increment });
});

app.post('/admin/dashboard', (req, res) => {
  houseEdge = parseFloat(req.body.houseEdge) / 100;
  increment = parseFloat(req.body.increment);
  res.redirect('/admin/dashboard');
});

// Main Game Loop
function gameLoop() {
  if (!gameStarted) return setTimeout(gameLoop, 1000);

  if (!countdownRunning && !gameRunning) {
    countdownRunning = true;
    countdownTime = 10;
    io.emit('countdown_start', { countdownTime });
    countdownInterval();
    return;
  }

  if (gameRunning) {
    currentMultiplier += increment;
    io.emit('multiplier_update', { multiplier: currentMultiplier });

    // Handle auto cash-out
    Object.keys(players).forEach((playerId) => {
      const player = players[playerId];
      if (player.autoCashOut && currentMultiplier >= player.autoCashOut) {
        handleCashOut(playerId);
      }
    });

    if (currentMultiplier >= crashPoint) endGame();
    else setTimeout(gameLoop, 100);
  }
}

function countdownInterval() {
  if (countdownTime > 0) {
    io.emit('countdown_update', { countdownTime });
    countdownTime--;
    setTimeout(countdownInterval, 1000);
  } else {
    startGame();
  }
}

function startGame() {
  currentMultiplier = 1.0;
  crashPoint = parseFloat((Math.random() * (10 - 1) + 1).toFixed(2));
  gameRunning = true;
  io.emit('game_start', { crashPoint });
  io.emit('disable_betting');  // Disable betting when the game starts
  gameLoop();
}

function endGame() {
  gameRunning = false;
  io.emit('game_crash', { crashPoint });
  setTimeout(() => gameLoop(), 5000);
}

function handleCashOut(playerId) {
  const player = players[playerId];
  if (!player.cashedOut && player.betAmount > 0) {
    const winnings = player.betAmount * currentMultiplier;
    player.credits += winnings;
    player.cashedOut = true;
    prizePool -= winnings;
    io.to(playerId).emit('cashed_out', { multiplier: currentMultiplier, winnings });
    io.emit('update_pools', { prizePool, housePool, jackpotPool });
  }
}

io.on('connection', (socket) => {
  players[socket.id] = { nickname: '', credits: 0, betAmount: 0, cashedOut: false, autoCashOut: null };

  socket.on('set_nickname', (data) => {
    players[socket.id].nickname = data.nickname;
    updatePlayerList();
  });

  socket.on('place_bet', (data) => {
    if (!countdownRunning) {
      socket.emit('status', { message: 'Bets can only be placed during the countdown!' });
      return;
    }
    const betAmount = data.betAmount;
    players[socket.id].betAmount = betAmount;
    players[socket.id].credits -= betAmount;
    players[socket.id].autoCashOut = data.autoCashOut || null; // Set auto cash-out multiplier
    const jackpotContribution = betAmount * 0.1;
    jackpotPool += jackpotContribution;
    prizePool += betAmount - (betAmount * houseEdge) - jackpotContribution;
    housePool += betAmount * houseEdge;
    io.emit('update_pools', { prizePool, housePool, jackpotPool });
  });

  socket.on('cash_out', () => {
    handleCashOut(socket.id);
  });

  function updatePlayerList() {
    const playerList = Object.values(players).map(p => p.nickname).filter(Boolean);
    io.emit('update_player_list', { playerList });
  }
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
