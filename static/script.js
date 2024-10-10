const socket = io();

// Chart variables
let ctx = document.getElementById('multiplierChart').getContext('2d');
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
let multiplierChart = new Chart(ctx, {
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
let username = '';
let betAmount = 0;

// Handle game start
socket.on('game_start', (data) => {
    gameRunning = true;
    multiplierData.labels = [];
    multiplierData.datasets[0].data = [];
    multiplierChart.update();
    document.getElementById('status').innerText = 'Game started!';
});

// Handle multiplier updates
socket.on('multiplier_update', (data) => {
    if (gameRunning) {
        let multiplier = data.multiplier;
        multiplierData.labels.push('');
        multiplierData.datasets[0].data.push(multiplier);
        multiplierChart.update();
    }
});

// Handle game crash
socket.on('game_crash', (data) => {
    gameRunning = false;
    document.getElementById('status').innerText = `Game crashed at ${data.crash_point}x`;
});

// Handle bet placed
socket.on('bet_placed', (data) => {
    document.getElementById('status').innerText = `${data.username} placed a bet of ${data.bet_amount}`;
});

// Handle cash out
socket.on('cashed_out', (data) => {
    if (data.username === username) {
        document.getElementById('status').innerText = `You cashed out at ${data.multiplier}x and won ${data.winnings}!`;
    } else {
        document.getElementById('status').innerText = `${data.username} cashed out at ${data.multiplier}x`;
    }
});

// Place bet
document.getElementById('placeBet').addEventListener('click', () => {
    username = document.getElementById('username').value;
    betAmount = parseFloat(document.getElementById('betAmount').value);
    if (username && betAmount > 0) {
        socket.emit('place_bet', { username: username, bet_amount: betAmount });
    } else {
        alert('Enter a valid username and bet amount.');
    }
});

// Cash out
document.getElementById('cashOut').addEventListener('click', () => {
    if (username) {
        socket.emit('cash_out', { username: username });
    } else {
        alert('You need to place a bet first.');
    }
});
