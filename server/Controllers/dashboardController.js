const { StatusCodes } = require('http-status-codes');
const prisma = require('../config/prismaClient');
const AppError = require('../utils/AppError');

const getStats = async (req, res, next) => {
    const id = Number(req.user?.id);

    const [
        allShipments,
        allRoutes,
        allVehicles,
    ] = await Promise.all([
        prisma.shipment.count({
            where: { user_ID: id },
        }),
        prisma.route.count({
            where: { user_ID: id },
        }),
        prisma.vehicle.count({
            where: { user_ID: id },
        }),
    ]);

    res.status(StatusCodes.OK).json({
        allShipments,
        activeShipments: allShipments,
        allRoutes,
        activeRoutes: allRoutes,
        allVehicles,
    });
};

module.exports = { getStats };
