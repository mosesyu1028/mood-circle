from flask_login import UserMixin
from .extensions import db


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key = True) # primary keys are required by SQLAlchemy
    email = db.Column(db.String(80), unique = True)
    username = db.Column(db.String(20), unique = True)
    password = db.Column(db.String(90))

    scores = db.relationship('Score', backref = 'user')

    def __repr__(self):
        return f'<User: {self.username}>'

class Score(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    score = db.Column(db.Integer)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'))

    def __repr__(self):
        return f'<User: {self.user_id}, Game: {self.game_id}, Score: {self.score}>'

class Game(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(80), unique = True)

    scores = db.relationship('Score', backref = 'game')

    def __repr__(self):
        return f'<Game: {self.name}>'