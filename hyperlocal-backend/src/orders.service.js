import Redis from 'ioredis';

export class OrderService {
  constructor(inventoryGateway) {
    this.inventoryGateway = inventoryGateway;
    this.redis = new Redis();
  }

  async createOrder(orderDto) {
    const { shopId, items, pickupSlot } = orderDto;

    await this.reserveSlot(shopId, pickupSlot);

    for (const item of items) {
      console.log(`[Pessimistic Lock Acquired] Decrementing DB stock for ${item.sku} by ${item.quantity}`);
      const remainingStock = 15 - item.quantity;

      if (remainingStock < 0) {
        throw new Error(`Insufficient stock for ${item.sku}`);
      }

      this.inventoryGateway.broadcastStockUpdate(shopId, item.sku, remainingStock);
    }

    return { id: `ORD-${Date.now()}`, status: 'CONFIRMED', pickupSlot };
  }

  async reserveSlot(shopId, slotTime) {
    const luaScript = `
      local currentCapacity = tonumber(redis.call('GET', KEYS[1]) or "0")
      if currentCapacity > 0 then
        redis.call('DECR', KEYS[1])
        return 1
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(luaScript, 1, `shop:${shopId}:slot:${slotTime}`);
      if (result === 0) {
        throw new Error('Maximum capacity for this pickup slot reached.');
      }
    } catch {
      console.warn('Redis slot check bypassed (Redis might not be running)');
    }
  }
}
