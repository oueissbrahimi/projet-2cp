const prisma = require('../config/prismaClient');
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');
const createNotifs = require('../utils/createNotifs');
const { emitToUser } = require('../socket');

const getContacts = async (req,res,next) => {
    
    const id = req.user.id
    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
        throw new AppError("No User Found", StatusCodes.UNAUTHORIZED, "USER_NOT_FOUND")
    }

    const contacts = await prisma.contact.findMany({
        where: { user: id, deletedAt: null },
        include: {
            contactRel: {
                select: {
                    id: true,
                    profile_Photo: true,
                    type: true,
                    individual: {
                        select: {
                            full_Name: true,
                            location: true,
                        },
                    },
                    business: {
                        select: {
                            business_Name: true,
                            locations: true,
                        },
                    },
                },
            },
        },
    })

    const normalizedContacts = contacts.map((contact) => ({
        ...contact,
        isDeleted: Boolean(contact.deletedAt),
    }))

    res.status(StatusCodes.OK).json(normalizedContacts)

}

const getMessages = async (req,res,next) => {

    const id = req.user.id
    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
        throw new AppError("No User Found", StatusCodes.UNAUTHORIZED, "USER_NOT_FOUND")
    }

    const { otherUserId } = req.query

    if (!otherUserId) {
        throw new AppError("otherUserId query parameter is required", StatusCodes.BAD_REQUEST, "MISSING_PARAM")
    }

    const otherId = parseInt(otherUserId)

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { fromUser: id, toUser: otherId },
                { fromUser: otherId, toUser: id }
            ]
        },
        orderBy: { createdAt: "asc" }
    })

    res.status(StatusCodes.OK).json(messages)
}

const sendMessage = async (req,res,next) => {

    const senderID = req.user.id
    const { text, image } = req.body
    const receiverID = parseInt(req.params.receiverId)

    const receiver = await prisma.user.findUnique({ where: { id: receiverID } })
    if (!receiver) {
        throw new AppError("Receiver not found", StatusCodes.NOT_FOUND, "USER_NOT_FOUND")
    }

    // Automatically add contact if it doesn't exist
    const existingContact = await prisma.contact.findUnique({
        where: { user_contactOf: { user: senderID, contactOf: receiverID } }
    })

    if (!existingContact) {
        // Create new contact if it doesn't exist
        await prisma.contact.create({
            data: {
                user: senderID,
                contactOf: receiverID
            }
        })
    } else if (existingContact.deletedAt) {
        // Restore contact if it was deleted
        await prisma.contact.update({
            where: { id: existingContact.id },
            data: { deletedAt: null }
        })
        await prisma.subscription.updateMany({
            where: { user_ID: senderID },
            data: { contactsCount: { increment: 1 } }
        })
    }

    let photo = null
    if (image) {
        photo = String(image).trim()
    }

    const newMsg = await prisma.message.create({
        data: {
            fromUser: senderID,
            toUser: receiverID,
            image: photo,
            msg: text?.trim() || null
        }
    })

    emitToUser(receiverID, 'receive_message', newMsg);  

    res.status(StatusCodes.CREATED).json({
        success: true,
        msg: "Message Sent Successfully",
        data: newMsg
    })
}

const addContact = async (req, res, next) => {
    const currentUserId = req.user.id
    const { contactUserId } = req.body

    if (!contactUserId) {
        throw new AppError("contactUserId is required", StatusCodes.BAD_REQUEST, "MISSING_PARAM")
    }

    const contactId = parseInt(contactUserId)

    if (currentUserId === contactId) {
        throw new AppError("Cannot add yourself as a contact", StatusCodes.BAD_REQUEST, "INVALID_CONTACT")
    }

    const contactUser = await prisma.user.findUnique({ where: { id: contactId } })
    if (!contactUser) {
        throw new AppError("Contact user not found", StatusCodes.NOT_FOUND, "USER_NOT_FOUND")
    }

    // Check if contact already exists
    const existingContact = await prisma.contact.findUnique({
        where: { user_contactOf: { user: currentUserId, contactOf: contactId } }
    })

    if (existingContact && !existingContact.deletedAt) {
        throw new AppError("Contact already added", StatusCodes.BAD_REQUEST, "CONTACT_EXISTS")
    }

    // If it was deleted, restore it
    if (existingContact && existingContact.deletedAt) {
        const restoredContact = await prisma.contact.update({
            where: { id: existingContact.id },
            data: { deletedAt: null }
        })
        await prisma.subscription.updateMany({
            where: { user_ID: currentUserId },
            data: { contactsCount: { increment: 1 } }
        })
        return res.status(StatusCodes.OK).json({
            success: true,
            msg: "Contact restored",
            data: restoredContact
        })
    }

    const newContact = await prisma.$transaction(async (tx) => {
        const contact = await tx.contact.create({
            data: {
                user: currentUserId,
                contactOf: contactId
            },
            include: {
                contactRel: {
                    select: {
                        id: true,
                        profile_Photo: true,
                        type: true,
                        individual: {
                            select: {
                                full_Name: true,
                                location: true,
                            },
                        },
                        business: {
                            select: {
                                business_Name: true,
                                locations: true,
                            },
                        },
                    },
                },
            },
        });
        await tx.contact.create({
            data: {
                user: contactId,
                contactOf: currentUserId
            },
            include: {
                contactRel: {
                    select: {
                        id: true,
                        profile_Photo: true,
                        type: true,
                        individual: {
                            select: {
                                full_Name: true,
                                location: true,
                            },
                        },
                        business: {
                            select: {
                                business_Name: true,
                                locations: true,
                            },
                        },
                    },
                },
            },
        });

        await tx.subscription.updateMany({
            where: { user_ID: currentUserId },
            data: { contactsCount: { increment: 1 } }
        });

        return contact;
    })

    res.status(StatusCodes.CREATED).json({
        success: true,
        msg: "Contact added successfully",
        data: newContact
    })
}

const deleteContacts = async (req, res, next) => {
    const currentUserId = req.user.id
    const { contactIds } = req.body

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
        throw new AppError("contactIds array is required", StatusCodes.BAD_REQUEST, "MISSING_PARAM")
    }

    const uniqueContactIds = [...new Set(contactIds.map((value) => parseInt(value, 10)).filter(Number.isInteger))]

    if (uniqueContactIds.length === 0) {
        throw new AppError("No valid contact IDs provided", StatusCodes.BAD_REQUEST, "INVALID_CONTACT_IDS")
    }

    const deletedContactIds = []

    await prisma.$transaction(async (tx) => {
        const updatedContacts = await tx.contact.updateMany({
            where: {
                user: currentUserId,
                id: { in: uniqueContactIds },
                deletedAt: null,
            },
            data: {
                deletedAt: new Date(),
            },
        })

        if (updatedContacts.count === 0) {
            return
        }

        const contacts = await tx.contact.findMany({
            where: {
                user: currentUserId,
                id: { in: uniqueContactIds },
            },
            select: {
                id: true,
                contactOf: true,
            },
        })

        deletedContactIds.push(...contacts.map((contact) => contact.id))

        const peerIds = contacts.map((contact) => contact.contactOf)
        if (peerIds.length > 0) {
            await tx.message.deleteMany({
                where: {
                    OR: peerIds.flatMap((peerId) => [
                        { fromUser: currentUserId, toUser: peerId },
                        { fromUser: peerId, toUser: currentUserId },
                    ]),
                },
            })
        }

        await tx.subscription.updateMany({
            where: { user_ID: currentUserId },
            data: {
                contactsCount: {
                    decrement: updatedContacts.count,
                },
            },
        })
    })

    res.status(StatusCodes.OK).json({
        success: true,
        msg: "Contacts deleted successfully",
        data: {
            deletedContactIds,
            deletedCount: deletedContactIds.length,
        },
    })
}

module.exports = { getContacts, getMessages, sendMessage, addContact, deleteContacts }