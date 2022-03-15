from flask import Flask

from flask_login import LoginManager
from flask_bootstrap import Bootstrap

from .extensions import db


def create_app():
    app = Flask(
        __name__,
        instance_relative_config = False
    )
    
    app.config.from_object('config.ProdConfig')
    # app.config.from_object('config.DevConfig')

    Bootstrap(app)

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = "auth_bp.login"
    login_manager.init_app(app)

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))


    with app.app_context():

        from .blueprints.general import general_bp
        from .blueprints.error import error_bp
        from .blueprints.profile import profile_bp
        from .blueprints.auth import auth_bp
        from .blueprints.games import games_bp

        bps = (general_bp, error_bp, profile_bp, auth_bp, games_bp)
        for bp in bps:
            app.register_blueprint(bp)
            

        return app