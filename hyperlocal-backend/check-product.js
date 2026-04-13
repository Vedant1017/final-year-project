import mongoose from 'mongoose';
import { ProductModel } from './src/models/Product.js';
import { ensureDbInitialized } from './src/db/connection.js';

async function main() {
  await ensureDbInitialized();
  const rawProducts = await ProductModel.collection.find({}).toArray();
  console.log("Raw _id samples: ");
  rawProducts.slice(0, 3).forEach(p => {
    console.log(`_id: ${p._id}, type: ${typeof p._id}, isObjectId: ${p._id instanceof mongoose.Types.ObjectId}`);
  });
  
  // Try to find the specific ID the user provided just in case
  const testId = '69da8e16b6de0ed17178df28';
  console.log(`\nTesting lookup for: ${testId}`);
  
  const byString = await ProductModel.collection.findOne({ _id: testId });
  console.log(`byString:`, !!byString);
  
  const byObjectId = await ProductModel.collection.findOne({ _id: new mongoose.Types.ObjectId(testId) });
  console.log(`byObjectId:`, !!byObjectId);
  
  process.exit(0);
}
main().catch(console.error);
