
class Utils {
  isString (value) {
    return typeof value === 'string';
  }

  isObject (value) {
    return value !== null && typeof value === 'object';
  }
}

module.exports = new Utils();
