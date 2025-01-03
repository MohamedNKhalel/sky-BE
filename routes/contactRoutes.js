const express = require('express');
const { body } = require('express-validator');
const contactController = require('../controllers/contactController');
const router = express.Router();

router.post('/contact', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('phone').isMobilePhone().withMessage('Invalid phone number'),
    body('description').notEmpty().withMessage('Description is required')
], contactController.addContact);

router.get('/contact', contactController.getContacts);

router.put('/contact/:id', contactController.updateContact);

router.delete('/contact/:id', contactController.deleteContact);

module.exports = router;
