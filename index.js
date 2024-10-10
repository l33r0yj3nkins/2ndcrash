const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Variables
let currentMultiplier = 1.0;
let crashPoint = 0;
let gameRunning = false;
let players = {};
const increment = 0.01;  // Increase multiplier by 0.01 per tick

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Helper function to generate random crash point
function generateCrashPoint() {
  return Math.random() * (10 - 1) + 1;  // Between 1.00x and 10.00x
}

// Main game loop
function gameLoop() {
  if (!gameRunning) {
    // Start a new game
    currentMultiplier = 1.0;
    crashPoint = generateCrashPoint();
    gameRunning = true;
    players = {};  // Reset players
    io.emit('game_start', { crashPoint });
    console.log(`New game started, crash point: ${crashPoint.toFixed(2)}`);
  } else {
    // Game is running
    currentMultiplier += increment;
    currentMultiplier = parseFloat(currentMultiplier.toFixed(2));

    io.emit('multiplier_update', { multiplier: currentMultiplier });

    if (currentMultiplier >= crashPoint) {
      // Game crashes
      gameRunning = false;
      io.emit('game_crash', { crashPoint });
      console.log(`Game crashed at ${crashPoint.toFixed(2)}x`);
      setTimeout(gameLoop, 5000);  // Wait 5 seconds before starting next game
    } else {
      setTimeout(gameLoop, 100);  // Continue updating multiplier every 100ms
    }
  }
}

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);

  socket.on('place_bet', (data) => {
    players[socket.id] = { betAmount: data.betAmount, cashedOut: false };
    io.emit('bet_placed', { playerId: socket.id, betAmount: data.betAmount });
  });

  socket.on('cash_out', () => {
    if (players[socket.id] && !players[socket.id].cashedOut) {
      players[socket.id].cashedOut = true;
      const winnings = players[socket.id].betAmount * currentMultiplier;
      io.emit('cashed_out', { playerId: socket.id, multiplier: currentMultiplier, winnings });
      console.log(`Player ${socket.id} cashed out at ${currentMultiplier.toFixed(2)}x with winnings: ${winnings}`);
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    console.log('Player disconnected:', socket.id);
  });
});

// Start the game loop
setTimeout(gameLoop, 5000);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
