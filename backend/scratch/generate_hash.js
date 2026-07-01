const bcrypt = require('bcryptjs');

async function reset() {
    const hash = await bcrypt.hash('Password123!', 12);
    console.log('---HASH_START---');
    console.log(hash);
    console.log('---HASH_END---');
}

reset();
