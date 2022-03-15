from flask import Blueprint, render_template
from flask import current_app as app

# Blueprint Configuration
general_bp = Blueprint (
    'general_bp', __name__,
    template_folder = 'templates',
    static_folder = 'static'
)

@general_bp.route('/')
def home():
	return render_template("home.html")

@general_bp.route('/donate')
def donate():
	return render_template("donate.html")