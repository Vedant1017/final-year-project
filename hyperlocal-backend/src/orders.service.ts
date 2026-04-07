import Redis from 'ioredis';
import { InventoryGateway } from './inventory.gateway';

export class OrderService {
  private redis: Redis;

  constructor(private inventoryGateway: InventoryGateway) {
    // Attempting to connect to default localhost redis
    this.redis = new Redis();
  }

  async createOrder(orderDto: any) {
    const { shopId, items, pickupSlot } = orderDto;

    // 1. Atomically check and reserve the booking slot limit
    await this.reserveSlot(shopId, pickupSlot);

    // 2. Perform ACID transaction to lock and decrement row (mocked here, using TypeORM pseudo code)
    // const queryRunner = dataSource.createQueryRunner();
    // await queryRunner.startTransaction();
    // try {
    for (const item of items) {
      // await queryRunner.manager.createQueryBuilder().setLock('pessimistic_write')...
      console.log(`[Pessimistic Lock Acquired] Decrementing DB stock for ${item.sku} by ${item.quantity}`);
      const remainingStock = 15 - item.quantity; // Mock DB result

      if (remainingStock < 0) {
        throw new Error(`Insufficient stock for ${item.sku}`);
      }

      // 3. Broadcast real-time stock reduction to all active customers watching this shop
      this.inventoryGateway.broadcastStockUpdate(shopId, item.sku, remainingStock);
    }
    // await queryRunner.commitTransaction();
    // } catch (err) { await queryRunner.rollbackTransaction() }

    return { id: `ORD-${Date.now()}`, status: 'CONFIRMED', pickupSlot };
  }

  private async reserveSlot(shopId: string, slotTime: string) {
    // Lua script to atomically check and decrement slot capacity
    const luaScript = `
      local currentCapacity = tonumber(redis.call('GET', KEYS[1]) or "0")
      if currentCapacity > 0 then
        redis.call('DECR', KEYS[1])
        return 1
      else
        return 0
      end
    `;

    // Assume we SET shop:s1:slot:10:00 to 5 (limit 5 people per slot)
    // this.redis.set(\`shop:\${shopId}:slot:\${slotTime}\`, 5) -> done somewhere else

    try {
      const result = await this.redis.eval(luaScript, 1, `shop:${shopId}:slot:${slotTime}`);
      if (result === 0) {
        throw new Error("Maximum capacity for this pickup slot reached.");
      }
    } catch (err: any) {
      // Ignore Redis connection errors for the dummy MVP if Redis isn't running
      console.warn("Redis slot check bypassed (Redis might not be running)");
    }
  }
}
