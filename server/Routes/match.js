const express = require('express');
const router = express.Router();
const checkToken = require('../Middlewares/checkToken');
const checkActivate = require('../Middlewares/CheckActivate');
const asyncHandler = require('../utils/asyncHandler');

const { suggestRoutes, suggestShipments} = require('../Controllers/matchController')

router.get('/routes', checkToken, checkActivate, asyncHandler(suggestRoutes))
router.get('/shipments', checkToken, checkActivate, asyncHandler(suggestShipments))

module.exports = router;