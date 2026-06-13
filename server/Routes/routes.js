const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const checkToken = require('../Middlewares/checkToken');
const requireProfile = require('../Middlewares/requireProfile');
const asyncHandler = require('../utils/asyncHandler');
const checkActivate = require('../Middlewares/CheckActivate');
const { checkRemainingRoutes } = require('../Middlewares/checkSubscriptions');
const {
    listRoutes,
    listMyRoutes,
    getRouteById,
    postRoute,
    editRoute,
    deleteRoute,
} = require('../Controllers/routesController');


router.get('/', checkToken, checkActivate, asyncHandler(listRoutes));
router.get('/me', checkToken, checkActivate, asyncHandler(listMyRoutes));
router.get('/:id', checkToken, checkActivate, asyncHandler(getRouteById));

router.post(
    '/',
    checkToken,
    checkRemainingRoutes,
    requireProfile,
    [
        check('name', 'Route name is required').notEmpty().isString(),
        check('photo', 'Photo must be a string').optional(),
        check('origin', 'Origin must be a string')
            .optional({ nullable: true })
            .isString(),
        check('destination', 'Destination must be a string')
            .optional({ nullable: true })
            .isString(),
        check('waypoints', 'Waypoints must be an array of strings')
            .optional({ nullable: true })
            .isArray(),
        check('waypoints.*', 'Each waypoint must be a non-empty string')
            .optional({ nullable: true })
            .isString()
            .trim()
            .notEmpty(),
        check('region', 'Region must be a string')
            .optional({ nullable: true })
            .isString(),
        check('date', 'Date must be a valid ISO date')
            .optional({ nullable: true })
            .isISO8601(),
        check('vehicle_plate', 'Vehicle plate number is required')
            .notEmpty()
            .matches(/^\d{5}-\d{3}-\d{2}$/),
        check('post_type', 'Post type must be REGION or ORIGIN_DESTINATION')
            .optional()
            .isIn(['REGION', 'ORIGIN_DESTINATION']),
        check('date_type', 'Date type must be DAY or INTERVAL')
            .optional()
            .isIn(['DAY', 'INTERVAL']),
        check('interval_start', 'Interval start must be a valid ISO date')
            .optional({ nullable: true })
            .isISO8601(),
        check('interval_end', 'Interval end must be a valid ISO date')
            .optional({ nullable: true })
            .isISO8601(),
    ],checkActivate,
    asyncHandler(postRoute)
);

router.patch(
    '/',
    checkToken,
    requireProfile,
    [
        check('route_ID', 'Route ID is required and must be numeric')
            .notEmpty()
            .isInt(),
        check('name', 'Route name must be a string').optional().isString(),
        check('photo', 'Photo must be a string').optional().isString(),
        check('origin', 'Origin must be a string').optional().isString(),
        check('destination', 'Destination must be a string')
            .optional()
            .isString(),
        check('waypoints', 'Waypoints must be an array of strings')
            .optional({ nullable: true })
            .isArray(),
        check('waypoints.*', 'Each waypoint must be a non-empty string')
            .optional({ nullable: true })
            .isString()
            .trim()
            .notEmpty(),
        check('region', 'Region must be a string').optional().isString(),
        check('date', 'Date must be a valid ISO date')
            .optional({ nullable: true })
            .isISO8601(),
        check('vehicle_plate', 'Vehicle plate must match 12345-123-12')
            .optional()
            .matches(/^\d{5}-\d{3}-\d{2}$/),
        check('post_type', 'Post type must be REGION or ORIGIN_DESTINATION')
            .optional()
            .isIn(['REGION', 'ORIGIN_DESTINATION']),
        check('date_type', 'Date type must be DAY or INTERVAL')
            .optional()
            .isIn(['DAY', 'INTERVAL']),
        check('interval_start', 'Interval start must be a valid ISO date')
            .optional({ nullable: true })
            .isISO8601(),
        check('interval_end', 'Interval end must be a valid ISO date')
            .optional({ nullable: true })
            .isISO8601(),
        check('status', 'Status must be a valid route status')
            .optional()
            .isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    ],checkActivate,
    asyncHandler(editRoute)
);

router.delete('/:id', checkToken, checkActivate, asyncHandler(deleteRoute));

module.exports = router;
