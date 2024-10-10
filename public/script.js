const socket = io();

// Chart.js Setup
const ctx = document.getElementById('multiplierChart').getContext('2d');
let multiplierData = {
  labels: [],
  datasets: [{
    label: 'Multiplier',
    data: [],
    borderColor: 'rgba(0, 255, 0, 1)',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    fill: true,
    tension: 0.1
  }]
};
const multiplierChart = new Chart(ctx, {
  type: 'line',
  data: multiplierData,
  options: {
    animation: false,
    scales: {
      x: { display: false },
      y: { beginAtZero: true }
    }
  }
});

let gameRunning = false;
let betAmount = 0;

// Handle game start
socket.on('game_start', (data) => {
  gameRunning = true;
  multiplierData.labels = [];
  multiplierData.datasets[0].data = [];
  multiplierChart.update();
  document.getElementById('status').innerText = 'New game started!';
  document.getElementById('prizePool').innerText = data.prizePool.toFixed(2);
  document.getElementById('housePool').innerText = data.housePool.toFixed(2);
});

// Handle multiplier updates
socket.on('multiplier_update', (data) => {
  if (gameRunning) {
    const multiplier = data.multiplier;
    multiplierData.labels.push('');
    multiplierData.datasets[0].data.push(multiplier);
    multiplierChart.update();
  }
});

// Handle game crash
socket.on('game_crash', (data) => {
  gameRunning = false;
  document.getElementById('status').innerText = `Game crashed at ${data.crashPoint.toFixed(2)}x`;
});

// Handle bet placed
socket.on('bet_placed', (data) => {
  if (data.playerId === socket.id) {
    document.getElementById('status').innerText = `You placed a bet of ${data.betAmount} credits.`;
  } else {
    document.getElementById('status').innerText = `Another player placed a bet.`;
  }
});

// Handle cash out
socket.on('cashed_out', (data) => {
  if (data.playerId === socket.id) {
    document.getElementById('status').innerText = `You cashed out at ${data.multiplier.toFixed(2)}x and won ${data.winnings} credits!`;
  } else {
    document.getElementById('status').innerText = `Another player cashed out.`;
  }
});

// Update player credits
socket.on('update_credits', (data) => {
  document.getElementById('playerCredits').innerText = data.credits.toFixed(2);
});

// Update pools
socket.on('update_pools', (data) => {
  document.getElementById('prizePool').innerText = data.prizePool.toFixed(2);
  document.getElementById('housePool').innerText = data.housePool.toFixed(2);
});

// Display status messages
socket.on('status', (data) => {
  document.getElementById('status').innerText = data.message;
});

// Give credits
document.getElementById('giveCredits').addEventListener('click', () => {
  socket.emit('give_credits');
});

// Place bet
document.getElementById('placeBet').addEventListener('click', () => {
  betAmount = parseFloat(document.getElementById('betAmount').value);
  if (betAmount > 0) {
    socket.emit('place_bet', { betAmount });
  } else {
    alert('Enter a valid bet amount.');
  }
});

// Cash out
document.getElementById('cashOut').addEventListener('click', () => {
  if (gameRunning) {
    socket.emit('cash_out');
  }
});
