const prisma = require('../config/prismaClient');
const AppError = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');
const createNotifs = require('../utils/createNotifs');

const createRequest = async (req, res, next) => {
    const userId = req.user.id;
    const { tier } = req.body;

    if (!tier || !['INDIVIDUAL', 'BUSINESS'].includes(tier)) {
        throw new AppError('Invalid tier. Must be INDIVIDUAL or BUSINESS.', StatusCodes.BAD_REQUEST, 'INVALID_TIER');
    }

    // Check if user already has a paid subscription (not FREE)
    const existingSub = await prisma.subscription.findUnique({
        where: { user_ID: userId },
    });
    if (existingSub && existingSub.tier !== 'FREE') {
        throw new AppError('You already have an active subscription.', StatusCodes.CONFLICT, 'SUBSCRIPTION_EXISTS');
    }

    // Check if user already has a pending request
    const pendingRequest = await prisma.subscriptionRequest.findFirst({
        where: { user_ID: userId, status: 'PENDING' },
    });
    if (pendingRequest) {
        throw new AppError('You already have a pending subscription request.', StatusCodes.CONFLICT, 'REQUEST_EXISTS');
    }

    // Resolve attachment path if a file was uploaded
    let attachment = null;
    if (req.file) {
        const path = require('path');
        const normalizedPath = req.file.path.split(path.sep).join('/');
        const uploadsIndex = normalizedPath.lastIndexOf('/uploads/');
        const originalName = encodeURIComponent(req.file.originalname || req.file.filename);
        attachment = uploadsIndex >= 0
            ? normalizedPath.slice(uploadsIndex + 1)
            : `uploads/${req.file.filename}`;
        attachment = `/${attachment}?name=${originalName}`;
    }

    const request = await prisma.subscriptionRequest.create({
        data: {
            user_ID: userId,
            tier,
            status: 'PENDING',
            attachment,
        },
    });

    res.status(StatusCodes.CREATED).json(request);
};

const listRequests = async (req, res, next) => {
    const statusFilter = req.query.status || null;
    const where = statusFilter ? { status: statusFilter } : {};

    const requests = await prisma.subscriptionRequest.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    profile_Photo: true,
                    individual: { select: { full_Name: true } },
                    business: { select: { business_Name: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.subscriptionRequest.count({ where });

    res.status(StatusCodes.OK).json({ requests, total });
};

const getMyRequest = async (req, res, next) => {
    const userId = req.user.id;

    const request = await prisma.subscriptionRequest.findFirst({
        where: { user_ID: userId },
        orderBy: { createdAt: 'desc' },
    });

    res.status(StatusCodes.OK).json(request);
};

const acceptRequest = async (req, res, next) => {
    const requestId = parseInt(req.params.id);

    const request = await prisma.subscriptionRequest.findUnique({
        where: { request_ID: requestId },
    });

    if (!request) {
        throw new AppError('Request not found.', StatusCodes.NOT_FOUND, 'REQUEST_NOT_FOUND');
    }
    if (request.status !== 'PENDING') {
        throw new AppError('Request is already processed.', StatusCodes.BAD_REQUEST, 'REQUEST_ALREADY_PROCESSED');
    }

    // Delete the existing FREE subscription and create the new paid one
    const existingSub = await prisma.subscription.findUnique({
        where: { user_ID: request.user_ID },
    });
    if (existingSub && existingSub.tier !== 'FREE') {
        throw new AppError('User already has an active paid subscription.', StatusCodes.CONFLICT, 'SUBSCRIPTION_EXISTS');
    }

    // Delete old FREE subscription if it exists
    if (existingSub) {
        await prisma.subscription.delete({ where: { sub_ID: existingSub.sub_ID } });
    }

    // Create paid subscription
    const subscription = await prisma.subscription.create({
        data: {
            user_ID: request.user_ID,
            tier: request.tier,
            isActive: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            shipmentsThisMonth: 0,
            routesThisMonth: 0,
            contactsCount: 0,
        },
    });

    // Mark request as accepted
    await prisma.subscriptionRequest.update({
        where: { request_ID: requestId },
        data: { status: 'ACCEPTED', reviewedAt: new Date() },
    });

    // Notify user
    await createNotifs(
        request.user_ID,
        'Subscription Approved',
        `Your ${request.tier.toLowerCase()} subscription request has been approved!`,
        'account',
        undefined,
        undefined
    );

    res.status(StatusCodes.OK).json({ request, subscription });
};

const rejectRequest = async (req, res, next) => {
    const requestId = parseInt(req.params.id);

    const request = await prisma.subscriptionRequest.findUnique({
        where: { request_ID: requestId },
    });

    if (!request) {
        throw new AppError('Request not found.', StatusCodes.NOT_FOUND, 'REQUEST_NOT_FOUND');
    }
    if (request.status !== 'PENDING') {
        throw new AppError('Request is already processed.', StatusCodes.BAD_REQUEST, 'REQUEST_ALREADY_PROCESSED');
    }

    await prisma.subscriptionRequest.update({
        where: { request_ID: requestId },
        data: { status: 'REJECTED', reviewedAt: new Date() },
    });

    // Notify user
    await createNotifs(
        request.user_ID,
        'Subscription Rejected',
        `Your ${request.tier.toLowerCase()} subscription request has been rejected.`,
        'account',
        undefined,
        undefined
    );

    res.status(StatusCodes.OK).json({ message: 'Request rejected successfully.' });
};

const refreshSubscription = async (req, res, next) => {
    const subId = parseInt(req.params.id);

    const sub = await prisma.subscription.findUnique({
        where: { sub_ID: subId },
    });

    if (!sub) {
        throw new AppError('Subscription not found.', StatusCodes.NOT_FOUND, 'SUBSCRIPTION_NOT_FOUND');
    }

    const refreshed = await prisma.subscription.update({
        where: { sub_ID: subId },
        data: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            shipmentsThisMonth: 0,
            routesThisMonth: 0,
            contactsCount: 0,
            isActive: true,
        },
    });

    await createNotifs(
        sub.user_ID,
        'Subscription Refreshed',
        `Your ${sub.tier.toLowerCase()} subscription has been refreshed by admin.`,
        'account',
        undefined,
        undefined
    );

    res.status(StatusCodes.OK).json(refreshed);
};

module.exports = {
    createRequest,
    listRequests,
    getMyRequest,
    acceptRequest,
    rejectRequest,
    refreshSubscription,
};
