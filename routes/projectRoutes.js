const express = require('express');
const upload = require('../middleware/upload');
const projectController = require('../controllers/projectController');
const router = express.Router();

router.post('/project', upload.single('image'), projectController.addProject);

router.get('/project', projectController.getProjects);

router.put('/project/:id', upload.single('image'), projectController.updateProject);

router.delete('/project/:id', projectController.deleteProject);

module.exports = router;
