const { StatusCodes } = require('http-status-codes');
const prisma = require('../config/prismaClient');
const AppError = require('../utils/AppError');


const toArray = (x) => x ? [].concat(x) : null

const toDateObject = (value) => {
    if (value === undefined || value === null || value === "") return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const getDateBounds = (beforeDate, afterDate) => ({
    start: afterDate ? toDateObject(afterDate) : null,
    end: beforeDate ? toDateObject(beforeDate) : null,
});

const orderedInclusion = (shipmentCoordinates, routeStops) => {
    let i = 0;
    let j = 0;

    while (i < shipmentCoordinates.length && j < routeStops.length) {
        if (String(shipmentCoordinates[i]).trim().toLowerCase() === String(routeStops[j]).trim().toLowerCase()) {
            i++;
        }
        j++;
    }

    return i === shipmentCoordinates.length;
}

const filterShipments = async (req,res,next) => {
    const {status, productTypes, possibleVehicles,
        origins, destinations, waypoints,
        minPrice, maxPrice, beforeDate, afterDate,
        minQuantity, maxQuantity, minWeight, maxWeight, minVolume, maxVolume,
        sortBy, sortOrder } = req.query

    const where = {}

    if (status) {
        where.status = String(status).toUpperCase().replace(/\s+/g, '_')
    }
    if (productTypes)    where.product_Type    = { in: toArray(productTypes) }
    if (possibleVehicles)where.possible_Veh = { in: toArray(possibleVehicles) }
    if (origins)         where.origin          = { in: toArray(origins) }
    if (destinations)    where.destination     = { in: toArray(destinations) }
    
    if (minPrice || maxPrice) where.price = {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
    }
    
    const shipmentDateBounds = getDateBounds(beforeDate, afterDate)
    if (shipmentDateBounds.start || shipmentDateBounds.end) where.createdAt = {
        ...(shipmentDateBounds.start && { gte: shipmentDateBounds.start }),
        ...(shipmentDateBounds.end && { lte: shipmentDateBounds.end }),
    }

    if (minQuantity || maxQuantity) where.quantity = {
        ...(minQuantity && { gte: Number(minQuantity) }),
        ...(maxQuantity && { lte: Number(maxQuantity) }),
    }

    if (minWeight || maxWeight) where.weight = {
        ...(minWeight && { gte: Number(minWeight) }),
        ...(maxWeight && { lte: Number(maxWeight) }),
    }

    if (minVolume || maxVolume) where.volume = {
        ...(minVolume && { gte: Number(minVolume) }),
        ...(maxVolume && { lte: Number(maxVolume) }),
    }
    
    const orderBy = sortBy ? {[sortBy]: sortOrder || 'asc'} : {createdAt: 'desc'}

    const waypointList = waypoints ? toArray(waypoints) : null

    const filteredShipments = await prisma.shipment.findMany({where, orderBy,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    profile_Photo: true,
                    individual: {
                        select: {
                            full_Name: true,
                        },
                    },
                    business: {
                        select: {
                            business_Name: true,
                        },
                    },
                },
            },
        }
    })

    const roadFilteredShipments = waypointList?.length
        ? filteredShipments.filter((shipment) => orderedInclusion([shipment.origin, shipment.destination], waypointList))
        : filteredShipments

    res.status(StatusCodes.OK).json(roadFilteredShipments)
    
}

// Add Filter For Capacity in filterRoutes + Solve Vehicle Type (this two are related to the vehicles, not routes)
// Change The Status definition in all the app


const filterRoutes = async (req,res,next) => {
    const { status, vehicleType, minCapacity, maxCapacity,
        origins, destinations, waypoints, region, beforeDate, afterDate, sortBy, sortOrder } = req.query

    const where = {}

    if (status) {
        where.status = String(status).toUpperCase().replace(/\s+/g, '_')
    }
    if (region)  where.region = region

    if (vehicleType || minCapacity || maxCapacity) where.vehicle = {
            ...(vehicleType && { type: { in: toArray(vehicleType) } }),
            ...(( minCapacity || maxCapacity) && {
                capacity: {
                    ...(minCapacity && { gte: parseFloat(minCapacity) }),
                    ...(maxCapacity && { lte: parseFloat(maxCapacity) }),
                }
            }),
        }

    if (waypoints) {
        const waypointList = toArray(waypoints)
        where.AND = [
            ...(where.AND || []),
            {
                OR: [
                    { origin: { in: waypointList } },
                    { waypoints: { hasSome: waypointList } },
                ],
            },
        ]
    }
    if (origins)      where.origin      = { in: toArray(origins) }
    if (destinations) where.destination = { in: toArray(destinations) }

    const routeDateBounds = getDateBounds(beforeDate, afterDate)
    if (routeDateBounds.start || routeDateBounds.end) {
        where.createdAt = {
            ...(routeDateBounds.start && { gte: routeDateBounds.start }),
            ...(routeDateBounds.end && { lte: routeDateBounds.end }),
        }
    }
    
    const orderBy = sortBy ? {[sortBy]: sortOrder || 'asc'} : {createdAt: 'desc'}

    const filteredRoutes = await prisma.route.findMany({where, orderBy, 
        include: {
            vehicle: {
                select: {
                    plate_Number: true,
                    vehicle_Name: true,
                    type: true,
                    color: true,
                    year: true,
                    capacity: true,
                },
            },
            user: {
                select: {
                    id: true,
                    profile_Photo: true,
                    individual: {
                        select: {
                            full_Name: true,
                        },
                    },
                    business: {
                        select: {
                            business_Name: true,
                        },
                    },
                },
            },
        }
    })

    res.status(StatusCodes.OK).json(filteredRoutes)
}


module.exports = { filterShipments, filterRoutes }