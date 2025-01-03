const mongoose = require('mongoose');

const connectDB = () => {
    const url = process.env.MONGO_URL;
    if (!url) {
        console.error('MongoDB URL is not defined in .env file!');
        process.exit(1);
    }
    mongoose.set('strictQuery', false);
    mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('Could not connect to MongoDB:', err));
};

module.exports = connectDB;
