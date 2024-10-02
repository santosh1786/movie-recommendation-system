// backend/src/models/User.js

const bcrypt = require('bcrypt');

class User {
  constructor(id, name, passwordHash) {
    this.id = id;
    this.name = name;
    this.passwordHash = passwordHash;
  }

  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  async validatePassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }
}

module.exports = User;
