const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const checkToken = require("../Middlewares/checkToken");
const checkAdmin = require("../Middlewares/checkPermissions");
const requireProfile = require("../Middlewares/requireProfile");
const checkActivate = require("../Middlewares/CheckActivate");
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
    createRequest,
    listRequests,
    getMyRequest,
    acceptRequest,
    rejectRequest,
    refreshSubscription,
} = require("../Controllers/subscriptionRequestController");

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const safeExt = path.extname(file.originalname || '').toLowerCase();
        cb(null, `sub-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
});

const subUpload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ok = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
        if (!ok) return cb(require('../utils/AppError')('Only images and PDFs are allowed', 400, 'VALIDATION_ERROR'));
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

// User: create a subscription request
router.post(
    '/',
    checkToken,
    requireProfile,
    checkActivate,
    subUpload.single('attachment'),
    [
        check('tier', 'Tier must be INDIVIDUAL or BUSINESS').isIn(['INDIVIDUAL', 'BUSINESS']),
    ],
    asyncHandler(createRequest)
);

// User: get own latest request
router.get('/me', checkToken, asyncHandler(getMyRequest));

// Admin: list all requests (optional ?status= filter)
router.get('/', checkToken, checkAdmin, asyncHandler(listRequests));

// Admin: accept a request
router.patch('/:id/accept', checkToken, checkAdmin, asyncHandler(acceptRequest));

// Admin: reject a request
router.patch('/:id/reject', checkToken, checkAdmin, asyncHandler(rejectRequest));

// Admin: refresh a subscription (reset dates and counters)
router.patch('/refresh/:id', checkToken, checkAdmin, asyncHandler(refreshSubscription));

module.exports = router;
