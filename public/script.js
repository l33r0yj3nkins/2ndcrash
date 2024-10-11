document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  let betAmountInput = document.getElementById('betAmount');
  let autoCashOutInput = document.getElementById('autoCashOut');
  const placeBetButton = document.getElementById('placeBetButton');
  const cashOutButton = document.getElementById('cashOutButton');
  const giveCreditButton = document.getElementById('giveCreditButton');
  const statusElement = document.getElementById('status');
  const prizePoolElement = document.getElementById('prizePool');
  const housePoolElement = document.getElementById('housePool');
  const jackpotPoolElement = document.getElementById('jackpotPool');
  const playerCreditsElement = document.getElementById('playerCredits');
  const currentMultiplierElement = document.getElementById('currentMultiplier');

  let currentMultiplier = 1.0;
  let gameData = [];
  let chart;

  // Initialize the chart
  const canvas = document.getElementById('multiplierChart');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  function drawChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    for (let i = 0; i < gameData.length; i++) {
      const x = (i / gameData.length) * canvas.width;
      const y = canvas.height - (gameData[i] / crashPoint) * canvas.height;
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Give Credit Button - Adds 100 credits
  giveCreditButton.addEventListener('click', () => {
    socket.emit('give_credit');
  });

  // Listen for real-time updates to multiplier
  socket.on('multiplier_update', (data) => {
    currentMultiplier = data.multiplier;
    currentMultiplierElement.innerText = `${currentMultiplier.toFixed(2)}x`;
    gameData.push(currentMultiplier);
    drawChart();
  });

  // Update pools when a player places a bet
  socket.on('update_pools', (data) => {
    prizePoolElement.innerText = data.prizePool.toFixed(2);
    housePoolElement.innerText = data.housePool.toFixed(2);
    jackpotPoolElement.innerText = data.jackpotPool.toFixed(2);
  });

  // Update player credits
  socket.on('update_credits', (data) => {
    playerCreditsElement.innerText = data.credits.toFixed(2);
  });

  // Countdown and game start
  socket.on('countdown_update', (data) => {
    statusElement.innerText = `Countdown: ${data.countdownTime} seconds`;
    placeBetButton.disabled = false;
    betAmountInput.disabled = false;
    autoCashOutInput.disabled = false;
    cashOutButton.disabled = true;
    gameData = []; // Reset game data for the new round
    drawChart(); // Clear the chart
  });

  let crashPoint = 0;

  socket.on('game_start', (data) => {
    statusElement.innerText = 'Game started!';
    placeBetButton.disabled = true;
    betAmountInput.disabled = true;
    autoCashOutInput.disabled = true;
    cashOutButton.disabled = false;
    crashPoint = data.crashPoint;
  });

  socket.on('game_crash', (data) => {
    statusElement.innerText = `Game crashed at ${data.crashPoint}x!`;
    cashOutButton.disabled = true;
  });

  // Bet placing
  placeBetButton.addEventListener('click', () => {
    const betAmount = parseFloat(betAmountInput.value);
    const autoCashOut = parseFloat(autoCashOutInput.value);

    if (isNaN(betAmount) || betAmount <= 0) {
      alert('Please enter a valid bet amount greater than 0.');
      return;
    }

    socket.emit('place_bet', { betAmount, autoCashOut });
  });

  // Cash out button
  cashOutButton.addEventListener('click', () => {
    socket.emit('cash_out');
    cashOutButton.disabled = true; // Disable to prevent multiple cash outs
  });

  socket.on('cashed_out', (data) => {
    statusElement.innerText = `You cashed out at ${data.multiplier.toFixed(2)}x and won ${data.winnings.toFixed(2)}!`;
    cashOutButton.disabled = true;
  });

  // Update player credits when status message is received
  socket.on('status', (data) => {
    if (data.credits !== undefined) {
      playerCreditsElement.innerText = data.credits.toFixed(2);
    }
    if (data.message) {
      statusElement.innerText = data.message;
    }
  });
});
