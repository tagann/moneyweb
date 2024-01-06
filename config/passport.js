// config/passport.js

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

passport.use('local-login', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, (req, username, password, done) => {
  // Vérifier les informations d'identification dans la base de données
  User.findOne({ where: { username: username } })
    .then(user => {
      if (!user) {
        return done(null, false, req.flash('error', 'Nom d\'utilisateur incorrect.'));
      }

      if (!user.validPassword(password)) {
        return done(null, false, req.flash('error', 'Mot de passe incorrect.'));
      }

      return done(null, user);
    })
    .catch(err => {
      return done(err);
    });
}));

passport.use('local-signup', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, (req, username, password, done) => {
  // Vérifier si l'utilisateur existe déjà
  User.findOne({ where: { username: username } })
    .then(existingUser => {
      if (existingUser) {
        return done(null, false, req.flash('error', 'Ce nom d\'utilisateur est déjà pris.'));
      }

      // Créer un nouvel utilisateur
      User.create({
        username: username,
        password: User.generateHash(password) // Utilisez la fonction de hachage pour stocker le mot de passe de manière sécurisée
      })
        .then(newUser => {
          return done(null, newUser);
        })
        .catch(err => {
          return done(err);
        });
    })
    .catch(err => {
      return done(err);
    });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // Récupérer l'utilisateur depuis la base de données en utilisant l'ID
  User.findByPk(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});

