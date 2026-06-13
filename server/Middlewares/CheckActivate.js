const prisma = require('../config/prismaClient');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');


const checkActivate = async (req, res, next) => {
    const id = parseInt(req.user.id);
    const user = await prisma.user.findUnique({
        where: { id: id },
        select: {
            status: true,
        },
    });

    if (!user || user.status !== 'ACTIVE') {
        const msg = user?.status === 'SUSPENDED'
            ? "You're suspended. Contact admin to review your state."
            : 'Unauthorized Action';
        throw new AppError(
            msg,
            StatusCodes.FORBIDDEN,
            'USER_SUSPENDED'
        );
    }
    next();
};
module.exports =  checkActivate ;