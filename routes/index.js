// routes/index.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Fonction pour s'assurer que l'utilisateur est authentifié
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


// Page d'accueil
router.get('/', (req, res) => {
  console.log('Current Page: home');
  res.render('index', { title: 'Accueil', user: req.user, currentPage: 'home' });
});

// Page de connexion
router.get('/login', (req, res) => {
  console.log('Current Page: login');
  res.render('login', { title: 'Connexion', message: req.flash('error'), currentPage: 'login' });  // Affiche les messages d'erreur de Passport 'Connexion' });
});
// Traitement du formulaire de connexion
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

// Page d'inscription
router.get('/signup', (req, res) => {
  console.log('Current Page: signup');
  res.render('signup', { message: req.flash('error'), currentPage: 'signup' }); // Affiche les messages d'erreur de Passport
});

// Traitement du formulaire d'inscription
router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/dashboard',
  failureRedirect: '/signup',
  failureFlash: true
}));

// Page du tableau de bord
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  console.log('Current Page: dashboard');
  res.render('dashboard', { user: req.user, currentPage: 'dashboard' });
});

// Déconnexion
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;

