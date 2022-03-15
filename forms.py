from flask_wtf import FlaskForm, RecaptchaField
from wtforms import StringField, PasswordField, BooleanField
from wtforms.validators import InputRequired, Email, EqualTo, Length

class LoginForm(FlaskForm):
    user_or_email = StringField('Username/Email', validators=[
        InputRequired("Please complete all fields"),
        Length(max=80)
    ])
    password = PasswordField('Password', validators=[
        InputRequired("Please complete all fields"),
        Length(max=80)
    ])
    remember = BooleanField('Remember me')



class SignupForm(FlaskForm):
    email = StringField('Email', validators=[
        InputRequired("Please complete all fields"),
        Length(max=80, message="Invalid email length"),
        Email("Please enter a valid email address")
    ])
    username = StringField('Username', validators=[
        InputRequired("Please complete all fields"),
        Length(min=3, max=20, message="Username must be between 3 and 20 characters long")
    ])
    password = PasswordField('Password', [
        InputRequired("Please complete all fields"),
        Length(min=6, max=80, message="Password must be between 6 and 80 characters long"),
        EqualTo('confirm', message="Passwords must match")
    ])
    confirm = PasswordField('Repeat Password', [
        InputRequired("Please complete all fields")
    ])
