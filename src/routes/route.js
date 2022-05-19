const express = require('express');
const { shorternUrl, redirectLink } = require('../controllers/urlController');

const router = express.Router();

router.post('/url/shorten', shorternUrl)
router.get('/:urlCode', redirectLink)

module.exports = router;