const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env from:', envPath);

if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    console.log('Keys in .env:', Object.keys(envConfig));
    console.log('DATABASE_URL in .env:', 'DATABASE_URL' in envConfig);
} else {
    console.log('.env file not found');
}
