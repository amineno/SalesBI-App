const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('Admin123!', 12);
console.log(hash);
