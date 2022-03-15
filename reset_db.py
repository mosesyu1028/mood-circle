from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin


app = Flask(__name__)

# app.config.from_object('config.DevConfig')
app.config.from_object('config.ProdConfig')


db = SQLAlchemy(app)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key = True) # primary keys are required by SQLAlchemy
    email = db.Column(db.String(80), unique = True)
    username = db.Column(db.String(20), unique = True)
    password = db.Column(db.String(90))

    scores = db.relationship('Score', backref = 'user')

class Score(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    score = db.Column(db.Integer)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'))

class Game(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(80), unique = True)

    scores = db.relationship('Score', backref = 'game')

# start anew
db.drop_all()
db.create_all()