const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');

// Load environment variables
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests, please try again later.',
});
app.use(limiter);

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file storage (used for projects)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, 'uploads');
        cb(null, uploadsDir); // Store files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + file.originalname;
        cb(null, uniqueSuffix); // Ensure unique filenames
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
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

// Authentication middleware using JWT
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(403).json({ message: 'Access denied' });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Access denied' });
        }
        req.user = user;
        next();
    });
};

// Mock databases
let contacts = [];
let projects = [];

// ===================== CONTACTS ENDPOINTS ===================== //

// POST endpoint to add a contact
app.post('/contact', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('phone').isMobilePhone().withMessage('Invalid phone number'),
    body('description').notEmpty().withMessage('Description is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, description } = req.body;

    const newContact = {
        id: Date.now(),
        name,
        email,
        phone,
        description,
    };

    contacts.push(newContact);
    res.status(201).json(newContact);
});

// PUT endpoint for updating a contact by ID
app.put('/contact/:id', authenticateToken, (req, res) => {
    const contactId = parseInt(req.params.id, 10);
    const contact = contacts.find(c => c.id === contactId);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const { name, email, phone, description } = req.body;
    contact.name = name || contact.name;
    contact.email = email || contact.email;
    contact.phone = phone || contact.phone;
    contact.description = description || contact.description;

    res.status(200).json(contact);
});

// DELETE endpoint to remove a contact by ID
app.delete('/contact/:id', authenticateToken, (req, res) => {
    const contactId = parseInt(req.params.id, 10);
    const index = contacts.findIndex(c => c.id === contactId);

    if (index === -1) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    contacts.splice(index, 1);
    res.status(200).json({ message: 'Contact deleted successfully' });
});

// GET endpoint to fetch all contacts
app.get('/contact', authenticateToken, (req, res) => {
    res.status(200).json(contacts);
});

// ===================== PROJECTS ENDPOINTS ===================== //

// POST endpoint to add a project with image upload
app.post('/project', authenticateToken, upload.single('image'), (req, res) => {
    // Log the request for debugging
    console.log('Request Body:', req.body);
    console.log('Uploaded File:', req.file);

    // Validate input fields
    if (!req.body.name || !req.body.description || !req.body.date || !req.file) {
        return res.status(400).json({ error: 'All fields including an image are required!' });
    }

    const { name, description, date } = req.body;
    const image = `/uploads/${req.file.filename}`; // Store the image path

    const newProject = {
        id: Date.now(),
        name,
        description,
        date,
        image,
    };

    projects.push(newProject);
    res.status(201).json(newProject);
});

// PUT endpoint to update a project by ID with image upload
app.put('/project/:id', authenticateToken, upload.single('image'), (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    const project = projects.find(p => p.id === projectId);

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const { name, description, date } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : project.image;

    project.name = name || project.name;
    project.description = description || project.description;
    project.date = date || project.date;
    project.image = image;

    res.status(200).json(project);
});

// DELETE endpoint to remove a project by ID
app.delete('/project/:id', authenticateToken, (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    const index = projects.findIndex(p => p.id === projectId);

    if (index === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    projects.splice(index, 1);
    res.status(200).json({ message: 'Project deleted successfully' });
});

// GET endpoint to fetch all projects
app.get('/project', authenticateToken, (req, res) => {
    res.status(200).json(projects);
});

// ===================== START SERVER ===================== //

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
