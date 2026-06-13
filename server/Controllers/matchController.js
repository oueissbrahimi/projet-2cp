const prisma = require('../config/prismaClient');
const AppError = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');

function orderedInclusion (shipmentCoordinates, routesWaypoints) {

    let i = 0;
    let j = 0;

    while (i < shipmentCoordinates.length && j < routesWaypoints.length) {
        if (shipmentCoordinates[i] === routesWaypoints[j]) {
            i++;
        }
        j++;
    }
    return i === shipmentCoordinates.length
}

const suggestRoutes = async (req,res,next) => {

    const { origin, destination } = req.query

    if (!origin || !destination) {
        throw new AppError('Origin and destination are required', StatusCodes.BAD_REQUEST, 'MISSING_PARAMETERS')
    }

    const shipmentsCoordinates = [origin, destination]

    const candidates = await prisma.route.findMany({
        where: {
            OR: [
                { origin: { in: shipmentsCoordinates } },
                { destination: { in: shipmentsCoordinates } },
                { waypoints: { hasSome: shipmentsCoordinates } }
            ],
            status: { in: ["SCHEDULED", "IN_PROGRESS"] }
        },
        include: {
            user: {
                select: {
                    id: true,
                    profile_Photo: true,
                    individual: { select: { full_Name: true } },
                    business: { select: { business_Name: true } },
                },
            },
        },
    })

    const suggestedRoutes = candidates.filter(route => {
        const stops = [route.origin, ...route.waypoints, route.destination]

        return orderedInclusion(shipmentsCoordinates, stops)
    })


    const availableTrucks = await prisma.user.findMany({
        where: {
            vehicles: {
                some: {
                    status: "AVAILABLE"
                }
            }
        },
        include: {
            individual: true,
            business: true,
            vehicles: {
                where: {
                    status: "AVAILABLE"
                }
            }
        },
    })
    const counter = suggestedRoutes.length + availableTrucks.length
    res.status(StatusCodes.OK).json({
        availableTrucks,
        suggestedRoutes,
        counter,
    })
}

const suggestShipments = async (req,res,next) => {

    const { origin, waypoints, destination } = req.query
    const stops = [origin, ...(waypoints ? JSON.parse(waypoints) : []), destination]

    const candidates = await prisma.shipment.findMany({
        where: {
            AND: [
                { origin: { in: stops } },
                { destination: { in: stops } },
                { status: "PENDING" },
            ]
        },
        include: {
            user: {
                select: {
                    id: true,
                    profile_Photo: true,
                    individual: { select: { full_Name: true } },
                    business: { select: { business_Name: true } },
                },
            },
        },
        orderBy: { shipment_ID: 'desc' },
    })

    const suggestions = candidates.filter(shipment=>{
        return orderedInclusion([shipment.origin, shipment.destination], stops)
    })

    const counter = suggestions.length
    res.status(StatusCodes.OK).json({ suggestions, counter })

}


module.exports = {suggestRoutes, suggestShipments}