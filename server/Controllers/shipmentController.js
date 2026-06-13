const prisma = require('../config/prismaClient');
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');
const createNotifs = require('../utils/createNotifs');

const normalizePositiveFloat = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
};


const listShipments = async (req, res, next) => {
    const userId = req.user.id;
    const fetchAll = req.query.all === 'true';
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = user?.role === 'ADMIN';

    const activeStatuses = ["PENDING"];
    const statusFilter = (isAdmin || fetchAll) ? {} : { status: { in: activeStatuses } };

    const sortBy = req.query.sortBy || null;
    let orderBy = { shipment_ID: 'desc' };
    if (sortBy === 'status') {
        orderBy = { status: 'asc' };
    }

    const allShipments = await prisma.shipment.findMany({
        where: statusFilter,
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
        },
        orderBy,
    });
    const total = await prisma.shipment.count({ where: statusFilter });
    res.status(StatusCodes.OK).json({
        success: true,
        total,
        shipments: allShipments,
    });
};

const listMyShipments = async (req, res, next) => {
    const myShipments = await prisma.shipment.findMany({
        where: { user_ID: req.user.id },
        orderBy: { shipment_ID: 'desc' },
    });

    res.status(StatusCodes.OK).json({
        success: true,
        total: myShipments.length,
        shipments: myShipments,
    });
};

const makePost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new AppError('Validation Failed', StatusCodes.BAD_REQUEST,'VALIDATION_ERROR');
    }

    const shipment = {
        user_ID: req.user.id,
        ...req.body,
    };

    const result = await prisma.$transaction(async (tx) => {
        const newShipment = await tx.shipment.create({
            data: shipment,
        });

        await tx.subscription.update({
            where: { user_ID: req.user.id },
            data: { shipmentsThisMonth: { increment: 1 } }
        });

        return newShipment;
    });

    await createNotifs(
        req.user.id,
        'Shipment Created',
        `Shipment ${result.shipment_ID} Created Successfully`,
        'shipments',
        'shipment',
        result.shipment_ID
    )

    res.status(StatusCodes.CREATED).json(result);

};

const editShipment = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new AppError('Validation Failed', StatusCodes.BAD_REQUEST,'VALIDATION_ERROR');
    }

    const { shipment_ID, ...fields } = req.body;
    const shipmentId = parseInt(shipment_ID);  

    const shipment = await prisma.shipment.findUnique({
        where: { shipment_ID: shipmentId },
    });

    if (!shipment || shipment.user_ID != req.user.id) {
        throw new AppError('Not authorized to update this shipment', StatusCodes.FORBIDDEN, 'FORBIDDEN');
    }

    const updateshipment = await prisma.shipment.update({
        where: { shipment_ID: shipmentId },
        data: fields,
    });

    await createNotifs(
        req.user.id,
        'Shipment Updated',
        `Shipment ${shipmentId} Updated Successfully`,
        'shipments',
        'shipment',
        shipmentId
    )

    res.status(StatusCodes.OK).json({
        msg: 'Shipment Updated Successfully',
        data: updateshipment,
    });
};

const deleteShipment = async (req, res, next) => {
    const id = parseInt(req.params.id);

    const shipment = await prisma.shipment.findUnique({
        where: { shipment_ID: id },
    });

    if (!shipment || shipment.user_ID != req.user.id) {
        throw new AppError(
            'Not authorized to delete this shipment',
            StatusCodes.FORBIDDEN,
            'FORBIDDEN'
        );
    }

    const deletedShipment = await prisma.shipment.delete({
        where: { shipment_ID: id },
    });

    await createNotifs(
        req.user.id,
        'Shipment Deleted',
        `Shipment ${id} Deleted Successfully`,
        'shipments',
        'shipment',
        id
    )

    res.status(StatusCodes.OK).json({ msg: 'Shipment Deleted Successfully' });
};

module.exports = { listShipments, listMyShipments, makePost, editShipment, deleteShipment };
