// https://www.npmjs.com/package/bcrypt

const bcrypt = require('bcrypt');
require('dotenv').config();

var saltRounds = 8;

exports.hashPassword = async (pw) => {
    return await bcrypt.hash(pw, saltRounds);
    // bcrypt.hash(pw, saltRounds, (err, hash) => {
    //     if (err) throw err;
    //     return hash;
    // });
}

exports.checkPassword = async (pw, hash) => {
    return await bcrypt.compare(pw, hash);
    // bcrypt.compare(pw, hash, (err, result) => {
    //     if (err) throw err;
    //     return result;
    // });
}
