// controllers/authController.js

const passport = require('passport');
const User = require('../models/user'); // Assurez-vous d'adapter le chemin selon votre structure

const authController = {};

// Affiche la page de connexion
authController.showLogin = (req, res) => {
  res.render('login', { message: req.flash('error') });
};

// Gère la soumission du formulaire de connexion
authController.login = passport.authenticate('local-login', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
});

// Affiche la page d'inscription
authController.showSignup = (req, res) => {
  res.render('signup', { message: req.flash('error') });
};

// Gère la soumission du formulaire d'inscription
authController.signup = passport.authenticate('local-signup', {
  successRedirect: '/dashboard',
  failureRedirect: '/signup',
  failureFlash: true
});

// Déconnexion de l'utilisateur
authController.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

module.exports = authController;

