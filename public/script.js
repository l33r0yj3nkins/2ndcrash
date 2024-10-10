document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  let betAmountInput = document.getElementById('betAmount');
  let autoCashOutInput = document.getElementById('autoCashOut'); // New input for auto cash-out
  const placeBetButton = document.getElementById('placeBetButton');
  const cashOutButton = document.getElementById('cashOutButton');
  
  // Disable betting after countdown ends
  socket.on('disable_betting', () => {
    placeBetButton.disabled = true;
    betAmountInput.disabled = true;
    autoCashOutInput.disabled = true;
  });

  // Countdown and game start
  socket.on('countdown_update', (data) => {
    document.getElementById('status').innerText = `Countdown: ${data.countdownTime} seconds`;
  });

  socket.on('game_start', () => {
    document.getElementById('status').innerText = 'Game started!';
    placeBetButton.disabled = true;
    betAmountInput.disabled = true;
    autoCashOutInput.disabled = true;
  });

  // Bet placing
  placeBetButton.addEventListener('click', () => {
    const betAmount = parseFloat(betAmountInput.value);
    const autoCashOut = parseFloat(autoCashOutInput.value);
    if (betAmount > 0) {
      socket.emit('place_bet', { betAmount, autoCashOut });
    } else {
      alert('Please enter a valid bet amount');
    }
  });

  // Cash out button
  cashOutButton.addEventListener('click', () => {
    socket.emit('cash_out');
  });

  socket.on('cashed_out', (data) => {
    document.getElementById('status').innerText = `You cashed out at ${data.multiplier}x and won ${data.winnings}!`;
  });
});
