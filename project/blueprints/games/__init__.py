from flask import Blueprint, render_template, redirect, url_for
from flask import current_app as app, request
from flask_login import login_required, current_user
from ...extensions import db

GAMES_LIST = ["reaction_time", "color_clicker"]

# Blueprint Configuration
games_bp = Blueprint (
    'games_bp', __name__,
    template_folder = 'templates',
    static_folder = 'static'
)

@games_bp.route('/games')
def games():
    return "TODO: games list"


@games_bp.route('/games/1')
def reaction_time():
	return render_template("reaction_time.html")

@games_bp.route('/games/2')
def color_clicker():
	return render_template("color_clicker.html", username = current_user.username)

# Upload score to db
@games_bp.post('/ul_score')
@login_required
def upload_score():

    return str(request.args.items()) # need for loop

