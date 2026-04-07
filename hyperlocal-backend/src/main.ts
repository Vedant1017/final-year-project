import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { InventoryGateway } from './inventory.gateway';
import { ensureDbInitialized } from './db/dataSource';
import { authRouter } from './routes/auth.routes';
import { productsRouter } from './routes/products.routes';
import { cartRouter } from './routes/cart.routes';
import { createCheckoutRouter } from './routes/checkout.routes';
import { ownerRouter } from './routes/owner.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

const inventoryGateway = new InventoryGateway(io);

// Initialize DB
ensureDbInitialized()
  .then(() => console.log('Database initialized.'))
  .catch((err) => {
    console.error('Failed to initialize database. Did you run migrations and set DATABASE_URL?', err);
  });

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/checkout', createCheckoutRouter(inventoryGateway));
app.use('/api/v1/owner', ownerRouter);

app.get('/api/v1/search', (req: Request, res: Response) => {
  // Stub for Geo Redis search
  res.json({
    results: [
      {
        shop: { id: "s1", name: "Fresh Mart", distance: "1.2km" },
        product: { sku: "MILK-500", name: "Organic Milk 500ml" },
        price: 30.00,
        stock: 15
      }
    ]
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend API with WebSockets running on port ${PORT}`);
});
