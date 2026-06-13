const prisma = require('../config/prismaClient');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');

async function findOrCreateUser(googleUserData) {
  try {
    const { googleId, email, name, picture } = googleUserData;

    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        phone: true,
        type: true,
        role: true,
        isVerified: true,
        profile_Photo: true,
      },
    });

    if (user) {
      return user;
    }

    user = await prisma.user.create({
      data: {
        email,
        type: 'INDIVIDUAL',
        role: 'USER',
        status: 'ACTIVE',
        isVerified: true,
        profile_Photo: picture,
        password: 'oauth_' + googleId,
        phone: '0000000000',
      },
      select: {
        id: true,
        email: true,
        phone: true,
        type: true,
        role: true,
        isVerified: true,
        profile_Photo: true,
      },
    });

    // Create FREE subscription for new Google user
    await prisma.subscription.create({
      data: {
        user_ID: user.id,
        tier: 'FREE',
        isActive: true,
        startDate: new Date(),
        endDate: null,
        shipmentsThisMonth: 0,
        routesThisMonth: 0,
        contactsCount: 0,
      },
    });

    return user;
  } catch (error) {
    console.error('Google user service error:', error.message);
    throw new AppError(
      'Failed to process Google user',
      StatusCodes.INTERNAL_SERVER_ERROR,
      'GOOGLE_USER_FAILED'
    );
  }
}

async function getUserById(userId) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        type: true,
        role: true,
        isVerified: true,
        profile_Photo: true,
      },
    });
  } catch (error) {
    console.error('Get user error:', error.message);
    return null;
  }
}

module.exports = {
  findOrCreateUser,
  getUserById,
};