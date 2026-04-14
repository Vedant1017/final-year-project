import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { InventoryGateway } from './inventory.gateway.js';
import { ensureDbInitialized } from './db/connection.js';
import { authRouter } from './routes/auth.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { createCheckoutRouter } from './routes/checkout.routes.js';
import { ownerRouter } from './routes/owner.routes.js';
import { createOwnerInventoryRouter } from './routes/owner.inventory.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { deliveryRouter } from './routes/delivery.routes.js';
import { discoveryRouter } from './routes/discovery.routes.js';
import { LocationGateway } from './location.gateway.js';
import { ChatGateway } from './chat.gateway.js';

dotenv.config();

const corsOrigin =
  process.env.CORS_ORIGIN?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? '*';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: corsOrigin } });

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const inventoryGateway = new InventoryGateway(io);
const locationGateway = new LocationGateway(io);
const chatGateway = new ChatGateway(io);

ensureDbInitialized()
  .then(() => console.log('MongoDB connected.'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB. Set MONGODB_URI and ensure mongod is running.', err);
  });

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/checkout', createCheckoutRouter(inventoryGateway));
app.use('/api/v1/owner', ownerRouter);
app.use('/api/v1/owner', createOwnerInventoryRouter(inventoryGateway));
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/delivery', deliveryRouter);
app.use('/api/v1/discovery', discoveryRouter);

/** Health check for monitoring and easy deployment verification */
app.get('/api/v1/ping', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/v1/search', (_req, res) => {
  res.json({
    results: [
      {
        shop: { id: 's1', name: 'Fresh Mart', distance: '1.2km' },
        product: { sku: 'MILK-500', name: 'Organic Milk 500ml' },
        price: 30.0,
        stock: 15
      }
    ]
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend API with WebSockets running on port ${PORT}`);
});
