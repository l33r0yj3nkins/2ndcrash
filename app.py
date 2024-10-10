from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import random
import eventlet
import os

eventlet.monkey_patch()  # Patches standard library to cooperate with other greenthreads

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with your secret key
socketio = SocketIO(app, async_mode='eventlet')

# Game variables
current_multiplier = 1.0
game_running = False
players = {}
crash_point = 0
increment = 0.01  # Multiplier increment per tick

@app.route('/')
def index():
    return render_template('index.html')

def generate_crash_point():
    # Random crash point between 1.00x and 10.00x
    return round(random.uniform(1.00, 10.00), 2)

def game_loop():
    global current_multiplier, game_running, crash_point, players
    while True:
        if not game_running:
            # Start a new game
            current_multiplier = 1.0
            crash_point = generate_crash_point()
            game_running = True
            players = {}
            socketio.emit('game_start', {'crash_point': crash_point})
            print(f"Game started. Crash point: {crash_point}")
        else:
            # Game is running
            current_multiplier += increment
            current_multiplier = round(current_multiplier, 2)
            socketio.emit('multiplier_update', {'multiplier': current_multiplier})

            if current_multiplier >= crash_point:
                # Game crashes
                game_running = False
                socketio.emit('game_crash', {'crash_point': crash_point})
                print(f"Game crashed at {crash_point}")
                eventlet.sleep(5)  # Wait before starting the next game
            else:
                eventlet.sleep(0.1)  # Control the speed of the multiplier increase

@socketio.on('connect')
def on_connect():
    print('Client connected')

@socketio.on('place_bet')
def on_place_bet(data):
    username = data['username']
    bet_amount = data['bet_amount']
    players[username] = {
        'bet_amount': bet_amount,
        'cashed_out': False
    }
    emit('bet_placed', {'username': username, 'bet_amount': bet_amount}, broadcast=True)

@socketio.on('cash_out')
def on_cash_out(data):
    username = data['username']
    if username in players and not players[username]['cashed_out']:
        players[username]['cashed_out'] = True
        winnings = players[username]['bet_amount'] * current_multiplier
        emit('cashed_out', {'username': username, 'multiplier': current_multiplier, 'winnings': winnings}, broadcast=True)

if __name__ == '__main__':
    # Start the game loop in the background
    socketio.start_background_task(target=game_loop)
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)
