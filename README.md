# Wesselli Logistics Platform

A full-stack logistics platform connecting shippers with carriers for freight transportation.

## Features
- User registration and authentication (Individual/Business)
- Shipment creation and management
- Route planning and vehicle assignment
- Real-time notifications (Socket.io)
- Payment processing (Stripe)
- Email verification and password reset
- Admin dashboard

## Tech Stack
- **Frontend**: React 19, React Router, Leaflet maps
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Real-time**: Socket.io
- **Payments**: Stripe
- **Email**: Gmail SMTP via Nodemailer

## Project Structure
```
/
├── client/          # React frontend
├── server/          # Express backend
│   ├── Controllers/ # Business logic
│   ├── Routes/      # API endpoints
│   ├── prisma/      # Database schema
│   └── Middlewares/ # Auth, validation
└── api-docs.md      # API documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd wesselli
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   # Configure .env (see server/README.md)
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   npm start
   ```

4. **Database**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   ```

### Environment Variables
Create `.env` in server/:
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="1d"
CLIENT_URL="http://localhost:3000"
EMAIL="your-gmail-address@gmail.com"
PASSWORD="your-gmail-app-password"
PORT=4000
NODE_ENV=development

# Optional: Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:4000/api/auth/google/callback"

# Legacy Mailtrap client variables (not used by the current email flow)
MAILTRAP_TOKEN="..."
MAILTRAP_HOST="sandbox.smtp.mailtrap.io"
MAILTRAP_PORT=2525
MAILTRAP_USER="..."
MAILTRAP_PASS="..."
MAILTRAP_FROM_EMAIL="noreply@yourapp.com"
```

The current verification and password-reset emails use Gmail SMTP through Nodemailer, so `EMAIL` and `PASSWORD` are the important mail settings for the running backend. The Mailtrap client variables are only needed if you re-enable the Mailtrap SDK in `server/mailtrap/mailtrap.config.js`.

## Usage
1. Register as Individual or Business user
2. Verify email
3. Create shipments or routes
4. Manage profile and view dashboard

## Documentation
All documentation is organized in the [DOCS](./DOCS/) folder:
- [User Manual](./DOCS/USER-MANUAL.docx)
- [Installation Manual] (./DOCS/INSTALLATION-MANUAL.docx)
## Contributing
1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push and create PR

## License
ISC