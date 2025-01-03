const Project = require('../models/projectModel');
const path = require('path');

// POST endpoint to add a project with image upload
exports.addProject = async (req, res) => {
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
};

// GET endpoint to fetch all projects
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

// PUT endpoint to update a project by ID with image upload
exports.updateProject = async (req, res) => {
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
};

// DELETE endpoint to remove a project by ID
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
};
