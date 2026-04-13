// Open 'd:\Github\final-year-project-vedant\hyperlocal-backend\clean-db.js' and paste this:
import mongoose from 'mongoose';
import { ensureDbInitialized } from './src/db/connection.js';
import { ProductModel } from './src/models/Product.js';
import { CartModel } from './src/models/Cart.js';

async function clean() {
  await ensureDbInitialized();
  await ProductModel.collection.drop().catch(() => {});
  await CartModel.collection.drop().catch(() => {});
  console.log("Old collections wiped!");
  process.exit(0);
}
clean();
