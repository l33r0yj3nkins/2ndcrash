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
let players = {};  // Stores player data
const increment = 0.01;  // Increase multiplier by 0.01 per tick
const houseEdge = 0.05;  // 5% house edge

// Initialize pools
let prizePool = 1000;  // Starting prize pool
let housePool = 0;     // House pool collects house edge

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Helper function to generate random crash point
function generateCrashPoint() {
  return parseFloat((Math.random() * (10 - 1) + 1).toFixed(2));  // Between 1.00x and 10.00x
}

// Main game loop
function gameLoop() {
  if (!gameRunning) {
    // Start a new game
    currentMultiplier = 1.0;
    crashPoint = generateCrashPoint();
    gameRunning = true;
    // Reset players' cashedOut status
    for (let playerId in players) {
      players[playerId].cashedOut = false;
    }
    io.emit('game_start', { crashPoint, prizePool, housePool });
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

      // Handle bets that didn't cash out
      for (let playerId in players) {
        const player = players[playerId];
        if (!player.cashedOut && player.betAmount > 0) {
          // Player loses bet
          console.log(`Player ${playerId} lost ${player.betAmount} credits.`);
          player.betAmount = 0;
        }
      }

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

  // Initialize player data
  if (!players[socket.id]) {
    players[socket.id] = {
      credits: 0,
      betAmount: 0,
      cashedOut: false,
    };
  }

  // Send initial data to the player
  socket.emit('update_pools', { prizePool, housePool });
  socket.emit('update_credits', { credits: players[socket.id].credits });

  socket.on('give_credits', () => {
    players[socket.id].credits += 100;
    socket.emit('update_credits', { credits: players[socket.id].credits });
    console.log(`Gave 100 credits to player ${socket.id}`);
  });

  socket.on('place_bet', (data) => {
    const betAmount = data.betAmount;
    const player = players[socket.id];

    if (!gameRunning) {
      socket.emit('status', { message: 'Wait for the next game to start.' });
      return;
    }

    if (player.betAmount > 0) {
      socket.emit('status', { message: 'You have already placed a bet.' });
      return;
    }

    if (player.credits >= betAmount && betAmount > 0) {
      player.betAmount = betAmount;
      player.credits -= betAmount;

      // Collect house edge
      const houseCut = betAmount * houseEdge;
      housePool += houseCut;

      // Add to prize pool
      const prizeContribution = betAmount - houseCut;
      prizePool += prizeContribution;

      // Notify the player
      socket.emit('update_credits', { credits: player.credits });
      io.emit('update_pools', { prizePool, housePool });
      io.emit('bet_placed', { playerId: socket.id, betAmount });
      console.log(`Player ${socket.id} placed a bet of ${betAmount} credits.`);
    } else {
      socket.emit('status', { message: 'Insufficient credits.' });
    }
  });

  socket.on('cash_out', () => {
    const player = players[socket.id];
    if (player && !player.cashedOut && player.betAmount > 0 && gameRunning) {
      player.cashedOut = true;
      const winnings = parseFloat((player.betAmount * currentMultiplier).toFixed(2));

      // Deduct from prize pool
      if (prizePool >= winnings) {
        prizePool -= winnings;
        player.credits += winnings;
        player.betAmount = 0;

        socket.emit('update_credits', { credits: player.credits });
        io.emit('update_pools', { prizePool, housePool });
        io.emit('cashed_out', { playerId: socket.id, multiplier: currentMultiplier, winnings });
        console.log(`Player ${socket.id} cashed out at ${currentMultiplier.toFixed(2)}x with winnings: ${winnings}`);
      } else {
        socket.emit('status', { message: 'Not enough funds in the prize pool to pay out winnings.' });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
  });
});

// Start the game loop after a short delay to allow players to connect
setTimeout(gameLoop, 5000);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
