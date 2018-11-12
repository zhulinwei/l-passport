
class PassportError {
  constructor(message) {
    const passportError = new Error(message);
    passportError.name = 'PassportError';
    return passportError; 
  }
}

module.exports = PassportError;
