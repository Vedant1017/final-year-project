import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Shop } from '../entities/Shop';
import { Product } from '../entities/Product';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Init00011600000000000 } from './migrations/0001-Init';
import { AddProductDescription16000000000001 } from './migrations/0002-AddProductDescription';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  host: databaseUrl ? undefined : process.env.DB_HOST ?? 'localhost',
  port: databaseUrl ? undefined : Number(process.env.DB_PORT ?? 5432),
  username: databaseUrl ? undefined : process.env.DB_USER ?? 'postgres',
  password: databaseUrl ? undefined : process.env.DB_PASSWORD ?? 'postgres',
  database: databaseUrl ? undefined : process.env.DB_NAME ?? 'hyperlocal',
  entities: [User, Shop, Product, Cart, CartItem, Order, OrderItem],
  migrations: [Init00011600000000000, AddProductDescription16000000000001],
  synchronize: false,
  logging: false
});

export async function ensureDbInitialized() {
  if (AppDataSource.isInitialized) return;
  await AppDataSource.initialize();
}

