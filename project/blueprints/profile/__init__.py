from flask import Blueprint, render_template
from flask import current_app as app
from flask_login import login_required, current_user

# Blueprint Configuration
profile_bp = Blueprint (
    'profile_bp', __name__,
    template_folder = 'templates',
    static_folder = 'static'
)

@profile_bp.route('/profile')
@login_required
def profile():
	return render_template("profile.html", username = current_user.username)