document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  const betAmountInput = document.getElementById('betAmount');
  const autoCashOutInput = document.getElementById('autoCashOut'); // Input for auto cash-out
  const placeBetButton = document.getElementById('placeBetButton');
  const cashOutButton = document.getElementById('cashOutButton');
  const statusElement = document.getElementById('status');

  // Ensure elements exist
  if (!betAmountInput || !autoCashOutInput || !placeBetButton || !cashOutButton || !statusElement) {
    console.error('Some DOM elements are missing. Please check your HTML structure.');
    return;
  }

  // Disable betting after countdown ends
  socket.on('disable_betting', () => {
    placeBetButton.disabled = true;
    betAmountInput.disabled = true;
    autoCashOutInput.disabled = true;
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

    if (!isNaN(autoCashOut) && autoCashOut < 1) {
      alert('Auto cash-out value must be greater than 1x.');
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
