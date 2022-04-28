const express = require('express');
const router = express.Router();
const { requireSignin, authMiddleware, adminMiddleware } = require('../controllers/auth');
const { read, publicProfile, update,roleUpdate, photo,allUsers } = require('../controllers/user');

router.get('/user/profile', requireSignin, authMiddleware, read);
router.get('/user/:username', publicProfile);
router.put('/user/update', requireSignin, authMiddleware, update);
router.put('/user/roleupdate', requireSignin, adminMiddleware, roleUpdate);
router.get('/user/photo/:username', photo);
router.get('/users',requireSignin, authMiddleware,adminMiddleware, allUsers);

module.exports = router;