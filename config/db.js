const mongoose = require('mongoose');

const connectDB = () => {
    mongoose.set('strictQuery', false); // Suppress warning
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('Could not connect to MongoDB:', err));
};

module.exports = connectDB;
