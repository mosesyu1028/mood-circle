from flask import Blueprint, render_template, make_response
from flask import current_app as app

# Blueprint Configuration
error_bp = Blueprint (
    'error_bp', __name__,
    template_folder = 'templates',
    static_folder = 'static'
)


@error_bp.errorhandler(404)
def not_found():
    """Page not found."""
    return make_response(render_template("error.html"), 404)