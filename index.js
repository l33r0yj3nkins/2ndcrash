<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Crash Game</title>
  <link rel="stylesheet" href="/style.css">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
</head>
<body>
  <h1>Crash Game</h1>

  <div id="game-container">
    <canvas id="multiplierChart"></canvas>
    <div id="currentMultiplier">1.00x</div>
  </div>

  <div id="controls">
    <input type="number" id="betAmount" placeholder="Bet Amount" min="1" step="0.01">
    <input type="number" id="autoCashOut" placeholder="Auto Cash-Out at X Multiplier" min="1" step="0.01">
    <button id="placeBetButton">Place Bet</button>
    <button id="cashOutButton">Cash Out</button>
    <button id="giveCreditButton">Give Credit (+100)</button>
  </div>

  <div id="status"></div>

  <div id="pools">
    <p>Prize Pool: <span id="prizePool">1000</span></p>
    <p>House Pool: <span id="housePool">0</span></p>
    <p>Jackpot Pool: <span id="jackpotPool">0</span></p>
  </div>

  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
  <script src="/script.js"></script>
</body>
</html>
