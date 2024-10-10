// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
  
    // Chart.js Setup
    const ctx = document.getElementById('multiplierChart').getContext('2d');
    const multiplierData = {
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
          y: {
            beginAtZero: true,
            ticks: {
              color: '#fff',
              font: {
                size: 14
              }
            }
          }
        }
      }
    });
  
    let gameRunning = false;
    let betAmount = 0;
  
    // DOM Elements
    const statusElement = document.getElementById('status');
    const prizePoolElement = document.getElementById('prizePool');
    const housePoolElement = document.getElementById('housePool');
    const playerCreditsElement = document.getElementById('playerCredits');
    const betAmountInput = document.getElementById('betAmount');
    const currentMultiplierElement = document.getElementById('currentMultiplier');
  
    // Event Listeners
    document.getElementById('startGameButton').addEventListener('click', () => {
      socket.emit('start_game');
      statusElement.innerText = 'Game started!';
      document.getElementById('startGameButton').disabled = true;
    });
  
    document.getElementById('giveCreditsButton').addEventListener('click', () => {
      socket.emit('give_credits');
    });
  
    document.getElementById('placeBetButton').addEventListener('click', () => {
      betAmount = parseFloat(betAmountInput.value);
      if (betAmount > 0) {
        socket.emit('place_bet', { betAmount });
      } else {
        alert('Enter a valid bet amount.');
      }
    });
  
    document.getElementById('cashOutButton').addEventListener('click', () => {
      if (gameRunning) {
        socket.emit('cash_out');
      }
    });
  
    // Socket.IO Event Handlers
  
    // Handle game start
    socket.on('game_start', (data) => {
      console.log('Received game_start event:', data);
      gameRunning = true;
      multiplierData.labels = [];
      multiplierData.datasets[0].data = [];
      multiplierChart.update();
      statusElement.innerText = 'New game started!';
      prizePoolElement.innerText = data.prizePool.toFixed(2);
      housePoolElement.innerText = data.housePool.toFixed(2);
      currentMultiplierElement.innerText = '1.00x';
    });
  
    // Handle multiplier updates
    socket.on('multiplier_update', (data) => {
      if (gameRunning) {
        const multiplier = data.multiplier;
        multiplierData.labels.push('');
        multiplierData.datasets[0].data.push(multiplier);
        multiplierChart.update();
        // Update current multiplier display
        currentMultiplierElement.innerText = `${multiplier.toFixed(2)}x`;
      }
    });
  
    // Handle game crash
    socket.on('game_crash', (data) => {
      gameRunning = false;
      statusElement.innerText = `Game crashed at ${data.crashPoint.toFixed(2)}x`;
      currentMultiplierElement.innerText = `${data.crashPoint.toFixed(2)}x - Crashed`;
    });
  
    // Handle bet placed
    socket.on('bet_placed', (data) => {
      if (data.playerId === socket.id) {
        statusElement.innerText = `You placed a bet of ${data.betAmount} credits.`;
      } else {
        statusElement.innerText = `Another player placed a bet.`;
      }
    });
  
    // Handle cash out
    socket.on('cashed_out', (data) => {
      if (data.playerId === socket.id) {
        statusElement.innerText = `You cashed out at ${data.multiplier.toFixed(2)}x and won ${data.winnings} credits!`;
      } else {
        statusElement.innerText = `Another player cashed out.`;
      }
    });
  
    // Update player credits
    socket.on('update_credits', (data) => {
      playerCreditsElement.innerText = data.credits.toFixed(2);
    });
  
    // Update pools
    socket.on('update_pools', (data) => {
      prizePoolElement.innerText = data.prizePool.toFixed(2);
      housePoolElement.innerText = data.housePool.toFixed(2);
    });
  
    // Display status messages
    socket.on('status', (data) => {
      statusElement.innerText = data.message;
    });
  });
  