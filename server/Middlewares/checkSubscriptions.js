const prisma = require('../config/prismaClient');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');


const getSubscription = async (req,res,next) => {
    
    const id = req.user.id
    const sub = await prisma.subscription.findUnique({
        where: { user_ID: id }
    })

    return sub
}

const checkRemainingShipments = async (req,res,next) => {

    const subscription = await getSubscription(req,res,next)
    const fullIndividual = subscription.tier === "INDIVIDUAL" && subscription.shipmentsThisMonth >= 100
    const fullFree = subscription.tier === "FREE" && subscription.shipmentsThisMonth >= 4
    if (fullIndividual || fullFree) {
        throw new AppError("You Have No Shipment Posts Remaining", StatusCodes.FORBIDDEN, "NO_SHIPMENT_POSTS")
    }
    next()
}

const checkRemainingRoutes = async (req,res,next) => {

    const subscription = await getSubscription(req,res,next)
    const fullIndividual = subscription.tier === "INDIVIDUAL" && subscription.routesThisMonth >= 100
    const fullFree = subscription.tier === "FREE" && subscription.routesThisMonth >= 4
    if (fullIndividual || fullFree) {
        throw new AppError("You Have No Route Posts Remaining", StatusCodes.FORBIDDEN, "NO_ROUTE_POSTS")
    }
    next()
}

const checkRemainingContacts = async (req,res,next) => {

    const subscription = await getSubscription(req,res,next)
    const fullIndividual = subscription.tier === "INDIVIDUAL" && subscription.contactsCount >= 15
    const fullFree = subscription.tier === "FREE" && subscription.contactsCount >= 2
    if (fullIndividual || fullFree) {
        throw new AppError("You Have No Contacts Remaining", StatusCodes.FORBIDDEN, "NO_CONTACTS")
    }
    next()
}


module.exports = { 
    getSubscription,
    checkRemainingShipments,
    checkRemainingRoutes,
    checkRemainingContacts
}