const express = require('express');
const router = express.Router();
const { contactForm, contactBlogAuthorForm,contactAny } = require('../controllers/form');
const { requireSignin, adminMiddleware } = require("../controllers/auth");

// validators
const { runValidation } = require('../validators');
const { contactFormValidator } = require('../validators/form');

router.post('/contact', contactFormValidator, runValidation, contactForm);
router.post('/contact-blog-author', contactFormValidator, runValidation, contactBlogAuthorForm);
router.post('/contact-any', requireSignin, adminMiddleware,contactAny);


module.exports = router;