// password-validation.js

function checkPasswordStrength(password) {
  // Définir les règles de force du mot de passe
  const minLength = 8;
  const hasNumber = /\d/;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
  const hasUpperCase = /[A-Z]/;

  // Vérifier la longueur minimale
  if (password.length < minLength) {
    return { strength: 'Faible (longueur minimale)',  className: 'weak' };
  }

  // Vérifier la présence de chiffres
  if (!hasNumber.test(password)) {
    return { strength: 'Faible (ajoutez des chiffres)',  className: 'weak' };
  }

  // Vérifier la présence de caractères spéciaux
  if (!hasSpecialChar.test(password)) {
    return { strength: 'Moyen (ajoutez des caractères spéciaux)',  className: 'medium' };
  }

  // Vérifier la présence de lettres majuscules
  if (!hasUpperCase.test(password)) {
    return { strength: 'Moyen (ajoutez des majuscules)',  className: 'medium' };
  }

  // Si toutes les conditions sont remplies, le mot de passe est fort
  return { strength: 'Fort',  className: 'strong' };
}
