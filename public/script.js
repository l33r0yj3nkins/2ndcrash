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
  const currentMultiplierElement = document.getElementById('currentMultiplier');
  
  let currentMultiplier = 1.0;

  // Give Credit Button - Adds 100 credits
  giveCreditButton.addEventListener('click', () => {
    socket.emit('give_credit');
  });

  // Listen for real-time updates to multiplier
  socket.on('multiplier_update', (data) => {
    currentMultiplier = data.multiplier;
    currentMultiplierElement.innerText = `${currentMultiplier.toFixed(2)}x`;
  });

  // Update pools when a player places a bet
  socket.on('update_pools', (data) => {
    prizePoolElement.innerText = data.prizePool;
    housePoolElement.innerText = data.housePool;
  });

  // Countdown and game start
  socket.on('countdown_update', (data) => {
    statusElement.innerText = `Countdown: ${data.countdownTime} seconds`;
  });

  socket.on('game_start', () => {
    statusElement.innerText = 'Game started!';
    placeBetButton.disabled = true;
    betAmountInput.disabled = true;
    autoCashOutInput.disabled = true;
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
  });

  socket.on('cashed_out', (data) => {
    statusElement.innerText = `You cashed out at ${data.multiplier}x and won ${data.winnings}!`;
  });
});
