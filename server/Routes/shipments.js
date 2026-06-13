const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const checkToken = require('../Middlewares/checkToken');
const requireProfile = require('../Middlewares/requireProfile');
const asyncHandler = require('../utils/asyncHandler');
const checkActivate = require('../Middlewares/CheckActivate');
const { checkRemainingShipments } = require('../Middlewares/checkSubscriptions');
const {
    listShipments,
    listMyShipments,
    makePost,
    editShipment,
    deleteShipment,
} = require('../Controllers/shipmentController');

router.get('/', checkToken, checkActivate, asyncHandler(listShipments));
router.get('/me', checkToken, checkActivate, asyncHandler(listMyShipments));

router.post(
    '/',
    checkToken,
    requireProfile,
    checkRemainingShipments,
    [
        check('title', 'Title is required').notEmpty().isString(),
        check('product_Type', 'Category is required').notEmpty().isString(),
        check('photo', 'Photo must be a string').optional(),
        check('origin', 'Origin is required').notEmpty().isString(),
        check('destination', 'Destination is required').notEmpty().isString(),
        check('volume', 'Volume is required and must be a number')
            .notEmpty()
            .isFloat({ gt: 0 }),
        check('weight', 'Weight (tons) is required and must be a number')
            .notEmpty()
            .isFloat({ gt: 0 }),
        check('price', 'Price is required and must be a number')
            .notEmpty()
            .isFloat({ gt: 0 }),
        check('date', 'Date must be a valid ISO date').isISO8601(),
        check('time', 'Time must be in format HH:MM')
            .notEmpty()
            .matches(/^\d{2}:\d{2}$/),
        check('priority', 'Priority must be Normal, High, or Urgent')
            .optional()
            .isIn(['Normal', 'High', 'Urgent']),
    ],
    checkActivate,
    asyncHandler(makePost)
);

router.patch(
    '/',
    checkToken,
    requireProfile,
    [
        check('shipment_ID', 'Shipment ID is required and must be a number')
            .notEmpty()
            .isNumeric(),
        check('title', 'Title must be a string').optional().isString(),
        check('category', 'Category must be a string').optional().isString(),
        check('photo', 'Photo must be a string').optional().isString(),
        check('origin', 'Origin must be a string').optional().isString(),
        check('destination', 'Destination must be a string')
            .optional()
            .isString(),
        check('volume', 'Volume must be a positive number')
            .optional()
            .isFloat({ gt: 0 }),
        check('weight', 'Weight (tons) must be a positive number')
            .optional()
            .isFloat({ gt: 0 }),
        check('price', 'Price must be a positive number')
            .optional()
            .isFloat({ gt: 0 }),
        check('date', 'Date must be a valid ISO date')
            .optional({ nullable: true })
            .isISO8601(),
        check('time', 'Time must be in format HH:MM')
            .optional()
            .matches(/^\d{2}:\d{2}$/),
        check('priority', 'Priority must be Normal, High, or Urgent')
            .optional()
            .isIn(['Normal', 'High', 'Urgent']),
        check('special_Information', 'Special information must be a string')
            .optional()
            .isString(),
        check('status', 'Status must be a valid shipment status')
            .optional()
            .isIn(['PENDING', 'MATCHED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
    ],
    checkActivate,
    asyncHandler(editShipment)
);

router.delete('/:id', checkToken, checkActivate, asyncHandler(deleteShipment));

module.exports = router;
