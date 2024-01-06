// routes/dashboard.js
require('dotenv').config(); // Charge les variables d'environnement depuis le fichier .env
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise'); // Importez le module mysql2


// Fonction pour s'assurer que l'utilisateur est authentifié
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Créez une nouveau pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Page du tableau de bord
router.get('/', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user, messages: req.flash() });
  //res.render('dashboard', { user: req.user });
});

// Page d'édition du profil (affichage du formulaire)
router.get('/edit-profile', ensureAuthenticated, (req, res) => {
  res.render('profile', { user: req.user });
});

// Route pour traiter la soumission du formulaire d'édition du profil
router.post('/edit-profile', ensureAuthenticated, async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Vérifier si les mots de passe correspondent
    if (password !== confirmPassword) {
      req.flash('editProfileMessage', 'Les mots de passe ne correspondent pas.');
      return res.redirect('/dashboard/edit-profile');
    }

    // Mettre à jour le profil dans la base de données
    const [result] = await pool.execute('UPDATE users SET username = ?, password = ? WHERE id = ?', [username, password, req.user.id]);

    if (result.affectedRows === 1) {
      req.flash('editProfileMessage', 'Profil mis à jour avec succès.'); // Correction ici
    } else {
      req.flash('editProfileMessage', 'Erreur lors de la mise à jour du profil.');
    }

    // Rediriger vers le tableau de bord après la modification du profil
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    req.flash('editProfileMessage', 'Une erreur s\'est produite lors de la mise à jour du profil.');
    res.redirect('/dashboard/edit-profile');
  }
});


// Page de déconnexion
router.get('/logout', (req, res) => {
  res.render('logout');
});

// Déconnexion avec fonction de rappel (POST)
router.post('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    res.redirect('/'); // Rediriger vers la page d'accueil après la déconnexion
  });
});

module.exports = router;

