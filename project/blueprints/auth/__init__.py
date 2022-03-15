from flask import Blueprint, render_template, redirect, url_for, make_response, flash, Markup
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, logout_user
from ...models import User
from ...extensions import db

from forms import LoginForm, SignupForm

# Blueprint Configuration
auth_bp = Blueprint (
    'auth_bp', __name__,
    template_folder = 'templates',
    static_folder = 'static'
)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()

    # POST
    if form.validate_on_submit():

        if "@" in form.user_or_email.data:
            user = User.query.filter_by(email=form.user_or_email.data).first()
        else:
            user = User.query.filter_by(username=form.user_or_email.data).first()


        if user:
            if check_password_hash(user.password, form.password.data):
                login_user(user, remember=form.remember.data)
                return redirect(url_for('profile_bp.profile'))
            else:
                flash(Markup("Incorrect password. <a href='/TODO_RESET_PASSWORD'>Reset password</a>"))
                return redirect(url_for('auth_bp.login'))
        else:
            flash(Markup("This account doesn't exist. <a href='/signup' class='alert-link'>Create account.</a>"))
            return redirect(url_for('auth_bp.login'))

    return render_template("login.html", form=form)



@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    form = SignupForm()

    # POST
    if form.validate_on_submit():
        usernameExists = User.query.filter_by(username=form.username.data).first()
        emailExists = User.query.filter_by(username=form.username.data).first()

        if usernameExists:
            flash(Markup("Username already exists. <a href='/login' class='alert-link'>Log in instead.</a>"))
            return redirect(url_for('auth_bp.signup'))
        if emailExists:
            flash(Markup("Email already exists. <a href='/login' class='alert-link'>Log in instead.</a>"))
            return redirect(url_for('auth_bp.signup'))

        hashed_password = generate_password_hash(form.password.data, method='sha256')

        new_user = User (
            username = form.username.data,
            email = form.email.data,
            password = hashed_password
        )
        db.session.add(new_user)
        db.session.commit()

        return redirect(url_for('auth_bp.login'))

    return render_template("signup.html", form=form)

@auth_bp.route('/register')
def register():
    return redirect(url_for('auth_bp.signup'))

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('general_bp.home'))

@auth_bp.route('/view')
@login_required
def view():

    db.create_all()

    users = User.query.all()

    response = list()

    for user in users:
        response.append({
            "username" : user.username,
            "email": user.email
        })

    return str(response)