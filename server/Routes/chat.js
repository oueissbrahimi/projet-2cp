const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const checkToken = require('../Middlewares/checkToken');
const asyncHandler = require('../utils/asyncHandler');
const checkActivate = require('../Middlewares/CheckActivate');
const { checkRemainingContacts } = require('../Middlewares/checkSubscriptions');

const {getContacts, getMessages, sendMessage, addContact, deleteContacts} = require("../Controllers/chatControllers")

router.post("/contacts/add", checkToken, checkActivate, checkRemainingContacts, asyncHandler(addContact))
router.get("/contacts", checkToken, checkActivate, asyncHandler(getContacts))
router.delete("/contacts", checkToken, checkActivate, asyncHandler(deleteContacts))
router.get("/messages", checkToken, checkActivate, asyncHandler(getMessages))
router.post("/messages/:receiverId", checkToken, checkActivate, asyncHandler(sendMessage))


module.exports = router