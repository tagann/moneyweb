// app.js
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql2/promise');

const flash = require('connect-flash');
const dotenv = require('dotenv'); // Ajout de dotenv

const bcrypt = require('bcrypt');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const dashboardRouter = require('./routes/dashboard');

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

const sessionSecret = process.env.SESSION_SECRET || uuid.v4();
const user = process.env.DB_USER || 'annas';

const app = express();

// Configuration du pool de connexion à la base de données MariaDB
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: user,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Configuration du moteur de vue EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware pour le logging des requêtes
app.use(logger('dev'));

// Middleware pour analyser le corps des requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware pour la gestion des cookies
app.use(cookieParser());

// Middleware pour la gestion des sessions
app.use(session({
  secret: sessionSecret,
  resave: true,
  saveUninitialized: true,
}));

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());


// Middleware pour connect-flash
app.use(flash());


// Middleware pour les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));


// Middleware pour passer les messages flash à toutes les vues
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});


// Stratégie locale pour Passport.js
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);

      if (rows.length === 0) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      const user = rows[0];

      // Utilisation de bcrypt pour comparer les mots de passe
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

function checkPasswordStrength(password) {
  // Définir les règles de force du mot de passe
  const minLength = 8;
  const hasNumber = /\d/;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
  const hasUpperCase = /[A-Z]/;

  // Vérifier la longueur minimale
  if (password.length < minLength) {
    return 1; // Faible (longueur minimale)
  }

  let strength = 0;

  // Vérifier la présence de chiffres
  if (hasNumber.test(password)) {
    strength += 2;
  }

  // Vérifier la présence de caractères spéciaux
  if (hasSpecialChar.test(password)) {
    strength += 2;
  }

  // Vérifier la présence de lettres majuscules
  if (hasUpperCase.test(password)) {
    strength += 2;
  }

  // La variable "strength" sera un nombre entre 0 et 7, vous pouvez ajuster cela selon vos critères
  return strength;
}


// Stratégie locale pour l'inscription avec Passport.js
passport.use('local-signup', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
},
async (req, username, password, done) => {
  try {
    const email = req.body.email;

    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length > 0) {
      console.log('Username already taken');
      return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
    } else {
      // Valider la force du mot de passe côté serveur
      const passwordStrength = checkPasswordStrength(password);

      console.log('Password strength:', passwordStrength);

      // Définir vos propres critères de force du mot de passe ici
      const minimumStrength = 8; // Exemple : force minimale requise

      if (passwordStrength < minimumStrength) {
        console.log('Weak password. Not creating user.');
        // Mot de passe trop faible, renvoyer un message d'erreur
        return done(null, false, req.flash('signupMessage', 'Mot de passe trop faible. Veuillez choisir un mot de passe plus fort.'));
      } else {
        console.log('Creating user...');
        // Créer un nouvel utilisateur
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email]);

        console.log('User creation result:', result);

        // Vérifiez si l'insertion a réussi
        if (result.affectedRows === 1) {
          // Récupérez le nouvel utilisateur créé
          const [newUserRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);

          if (newUserRows.length === 1) {
            const newUser = newUserRows[0];

            console.log('User created successfully:', newUser);

            // L'utilisateur a été ajouté avec succès
            return done(null, newUser);
          } else {
            console.log('Error creating user. User not found.');
            // Il y a eu un problème lors de la récupération de l'utilisateur créé
            return done(null, false, req.flash('signupMessage', 'Error creating user.'));
          }
        } else {
          console.log('Error creating user. No rows affected.');
          // Il y a eu un problème lors de l'insertion
          return done(null, false, req.flash('signupMessage', 'Error creating user.'));
        }
      }
    }
  } catch (error) {
    console.error('Error in signup strategy:', error);
    return done(error);
  }
}));


// Sérialisation et désérialisation des utilisateurs
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);

    if (rows.length === 0) {
      return done(null, false);
    }

    const user = rows[0];
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/dashboard', dashboardRouter);

// Middleware pour gérer les erreurs 404
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Middleware pour gérer les erreurs
app.use((err, req, res, next) => {
  // Définir les locaux, en fournissant uniquement l'erreur en mode développement
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Rendre la page d'erreur
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

