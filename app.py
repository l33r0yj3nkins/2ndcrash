from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
import random
import os

app = Flask(__name__)
socketio = SocketIO(app, async_mode='eventlet')

# Game state variables
crash_history = []
players = {}
prize_pool = 1000
house_pool = 0
house_edge = 0.05

@app.route('/')
def index():
    return render_template('index.html', prize_pool=prize_pool, house_pool=house_pool)

# SocketIO event for a new game round
@socketio.on('place_bet')
def handle_place_bet(data):
    username = data['username']
    bet_amount = data['bet']
    auto_cashout = data.get('auto_cashout')

    # Place player bet
    if username in players:
        return
    
    players[username] = {
        'bet': bet_amount,
        'auto_cashout': auto_cashout,
        'cashout': False
    }
    emit('bet_placed', {'username': username, 'bet': bet_amount}, broadcast=True)

@socketio.on('give_credit')
def give_credit(data):
    username = data['username']
    players[username] = {'credits': players.get(username, {}).get('credits', 0) + 100}
    emit('credit_given', {'username': username, 'credits': players[username]['credits']}, broadcast=True)

@socketio.on('game_round')
def start_game_round():
    multiplier = round(random.uniform(1.0, 10.0), 2)
    crash_history.append(multiplier)
    global prize_pool, house_pool

    # Simulate game logic
    for player, details in players.items():
        if details['auto_cashout'] and details['auto_cashout'] <= multiplier:
            details['cashout'] = True
        if details['cashout']:
            payout = details['bet'] * details['auto_cashout']
            prize_pool -= payout
            emit('payout', {'username': player, 'payout': payout}, broadcast=True)

    house_pool += prize_pool * house_edge
    emit('round_result', {'multiplier': multiplier, 'prize_pool': prize_pool, 'house_pool': house_pool}, broadcast=True)

@socketio.on('get_crash_history')
def get_crash_history():
    emit('crash_history', crash_history[-10:])  # send last 10 rounds

if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
