import { describe, expect, it, vi } from 'vitest';
import { DuneAnalyticsService } from '../duneAnalyticsService';

describe('Dune exchange-flow timeframes', () => {
  it('forwards 30d to Dune and isolates its cache from 7d', async () => {
    const service = new DuneAnalyticsService();
    const executeQuery = vi.fn(async () => ({ result: { rows: [] } }));
    Object.defineProperty(service, 'executeQuery', {
      configurable: true,
      value: executeQuery,
    });

    await service.getExchangeFlows(undefined, '30d');
    await service.getExchangeFlows(undefined, '30d');
    await service.getExchangeFlows(undefined, '7d');

    expect(executeQuery).toHaveBeenCalledTimes(2);
    expect(executeQuery).toHaveBeenNthCalledWith(
      1,
      1745824,
      expect.objectContaining({ time_range: '30 days' }),
    );
    expect(executeQuery).toHaveBeenNthCalledWith(
      2,
      1745824,
      expect.objectContaining({ time_range: '7 days' }),
    );
  });
});