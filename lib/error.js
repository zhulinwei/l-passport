
class PassportError extends Error {
  constructor (message) {
    super(message);
    PassportError.prototype.name = 'PassportError';
  }
}

module.exports = PassportError;
