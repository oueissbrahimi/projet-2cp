require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('CORS origin not allowed'));
        },
    })
);

const PORT = process.env.PORT || 5000;

const { io } = initSocket(server, allowedOrigins);

const authRouter = require('./Routes/auth');
const profileRouter = require('./Routes/profile');
const shipmentsRouter = require('./Routes/shipments');
const routeRouter = require('./Routes/routes');
const adminRouter = require('./Routes/admin');
const dashboardRouter = require('./Routes/dashboard');
const notificationsRouter = require('./Routes/notifications')
const subscriptionsRouter = require('./Routes/subscriptions')
const subscriptionRequestRouter = require('./Routes/subscriptionRequests')
const uploadsRouter = require('./Routes/uploads')
const filtersRouter = require('./Routes/filters')
const matchRouter = require('./Routes/match')
const chatRouter = require('./Routes/chat')

const errorHandler = require('./Middlewares/errorHandler');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/profile', profileRouter);
app.use('/api/shipments', shipmentsRouter);
app.use('/api/routes', routeRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter)
app.use('/api/subscriptions', subscriptionsRouter)
app.use('/api/subscription-requests', subscriptionRequestRouter)
app.use('/api/uploads', uploadsRouter)
app.use('/api/filter', filtersRouter)
app.use('/api/match', matchRouter)
app.use('/api/chat', chatRouter)

app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
