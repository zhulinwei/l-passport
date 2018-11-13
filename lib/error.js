
class PassportError extends Error {
  constructor() {
    super();
    this.name = 'PassportError';
  }
}

module.exports = PassportError;
