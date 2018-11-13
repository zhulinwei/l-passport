
class PassportError extends Error {
  constructor(message) {
    super();
    this.name = 'PassportError';
    this.message = message;
    Error.captureStackTrace(this, PassportError);
  }
}

module.exports = PassportError;
