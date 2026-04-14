import { Router } from 'express';
import { ShopModel } from '../models/Shop.js';
import { ProductModel } from '../models/Product.js';

export const discoveryRouter = Router();

discoveryRouter.get('/search', async (req, res) => {
  try {
    const { q, lat, lng, brand, quantity, sort = 'price' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxDistance = 10000000; // Increased radius to ensure results show up in demo regardless of location

    // 1. Find nearby shops and their products using aggregation
    const results = await ShopModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [userLng, userLat] },
          distanceField: 'distance_km',
          maxDistance: maxDistance,
          spherical: true,
          distanceMultiplier: 0.001 // Convert meters to km
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'shopId',
          as: 'products'
        }
      },
      { $unwind: '$products' },
      {
        $match: {
          'products.name': { 
            $regex: (q || '').trim().split(/\s+/).join('|'), 
            $options: 'i' 
          }
        }
      }
    ]);

    // 2. Post-aggregation filtering and mapping
    let shopItems = results.map(r => ({
      id: r.products._id,
      shop_name: r.name,
      distance_km: parseFloat(r.distance_km.toFixed(2)),
      price: parseFloat(r.products.price),
      brand: r.products.brand || 'Generic',
      quantity: r.products.quantity || 'N/A',
      stock: r.products.stock > 0,
      product_name: r.products.name,
      imageUrl: r.products.imageUrl
    }));

    // Apply filters
    if (brand) {
      shopItems = shopItems.filter(i => i.brand.toLowerCase().includes(brand.toLowerCase()));
    }
    if (quantity) {
      shopItems = shopItems.filter(i => i.quantity.toLowerCase().includes(quantity.toLowerCase()));
    }

    if (shopItems.length === 0) {
      return res.json({
        product: q || 'Product',
        lowest_price: null,
        nearby_shops: []
      });
    }

    // 3. Find lowest price
    const lowestPriceItem = [...shopItems].sort((a, b) => a.price - b.price)[0];

    // 4. Final sorting
    if (sort === 'price') {
      shopItems.sort((a, b) => a.price - b.price);
    } else if (sort === 'distance') {
      shopItems.sort((a, b) => a.distance_km - b.distance_km);
    }

    res.json({
      product: q || 'Product',
      lowest_price: {
        price: lowestPriceItem.price,
        shop_name: lowestPriceItem.shop_name,
        brand: lowestPriceItem.brand,
        quantity: lowestPriceItem.quantity
      },
      nearby_shops: shopItems
    });

  } catch (error) {
    console.error('Discovery Search Error:', error);
    res.status(500).json({ success: false, message: 'Server error during discovery' });
  }
});
