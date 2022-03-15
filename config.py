"""Flask configuration"""

from os import environ, path
from dotenv import load_dotenv

basedir = path.abspath(path.dirname(__file__))
load_dotenv(path.join(basedir, '.env'))


class Config:
    """Base config"""

    FLASK_APP = 'project'

    SECRET_KEY = environ.get('SECRET_KEY')

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    static_folder = "static"
    template_folder = "templates"


class ProdConfig(Config):
    FLASK_ENV = 'production'
    DEBUG = False
    TESTING = False

    SQLALCHEMY_DATABASE_URI = environ.get('DATABASE_URL')


class DevConfig(Config):
    FLASK_ENV = 'development'
    DEBUG = True
    TESTING = True

    SQLALCHEMY_DATABASE_URI = environ.get('LOCAL_DB')