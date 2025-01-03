const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.set('strictQuery', false); // Suppress warning
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Define MongoDB schemas
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    description: { type: String, required: true }
});

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    image: { type: String, required: true }
});

// Create MongoDB models
const Contact = mongoose.model('Contact', contactSchema);
const Project = mongoose.model('Project', projectSchema);

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests, please try again later.',
});
app.use(limiter);

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, 'uploads');
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + file.originalname;
        cb(null, uniqueSuffix);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedFileTypes = /jpeg|jpg|png|gif/;
        const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedFileTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            return cb(new Error('Only image files are allowed'), false);
        }
    }
});

// ===================== CONTACTS ENDPOINTS ===================== //

// POST endpoint to add a contact
app.post('/contact', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('phone').isMobilePhone().withMessage('Invalid phone number'),
    body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, phone, description } = req.body;
        const newContact = new Contact({ name, email, phone, description });
        await newContact.save();
        res.status(201).json(newContact);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add contact' });
    }
});

// GET endpoint to fetch all contacts
app.get('/contact', async (req, res) => {
    try {
        const contacts = await Contact.find();
        res.status(200).json(contacts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// PUT endpoint to update a contact by ID
app.put('/contact/:id', async (req, res) => {
    try {
        const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.status(200).json(contact);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

// DELETE endpoint to remove a contact by ID
app.delete('/contact/:id', async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.status(200).json({ message: 'Contact deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

// ===================== PROJECTS ENDPOINTS ===================== //

// POST endpoint to add a project with image upload
app.post('/project', upload.single('image'), async (req, res) => {
    try {
        const { name, description, date } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const image = `/uploads/${req.file.filename}`;
        const newProject = new Project({ name, description, date, image });
        await newProject.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add project' });
    }
});

// GET endpoint to fetch all projects
app.get('/project', async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// PUT endpoint to update a project by ID with image upload
app.put('/project/:id', upload.single('image'), async (req, res) => {
    try {
        const updates = req.body;
        if (req.file) {
            updates.image = `/uploads/${req.file.filename}`;
        }
        const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE endpoint to remove a project by ID
app.delete('/project/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// ===================== START SERVER ===================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
