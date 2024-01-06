// routes/users.js
const express = require('express');
const router = express.Router();

// Page de profil utilisateur
router.get('/profile', (req, res) => {
  res.render('profile', { user: req.user });
});

// Page de modification du profil
router.get('/edit-profile', (req, res) => {
  res.render('edit-profile', { user: req.user });
});

// Traitement du formulaire de modification du profil
router.post('/edit-profile', (req, res) => {
  // Ajoutez ici la logique de modification du profil
});

module.exports = router;

