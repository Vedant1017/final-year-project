import axios from 'axios';

async function test() {
  try {
    // login
    console.log('Logging in...');
    const login = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'customer@demo.com',
      password: 'password123'
    });
    const token = login.data.token;
    console.log('Token:', token);

    // get cart
    console.log('Fetching cart...');
    try {
      const cartRes = await axios.get('http://localhost:3001/api/v1/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Cart fetched:', cartRes.data);
    } catch(e) {
      console.error('Failed to get cart:', e.response?.data || e.message);
    }

    // get products to find one ID
    const prodRes = await axios.get('http://localhost:3001/api/v1/products');
    const pid = prodRes.data.products[0].id;
    console.log('Product ID:', pid);

    // add to cart
    console.log('Adding to cart...');
    try {
      const addRes = await axios.post('http://localhost:3001/api/v1/cart/items', {
        productId: pid,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Added:', addRes.data);
    } catch(e) {
      console.error('Failed to add to cart:', e.response?.data || e.message);
    }
  } catch(e) {
    console.error('Test failed:', e.message);
  }
}
test();
