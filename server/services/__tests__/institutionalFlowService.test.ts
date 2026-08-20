import { beforeEach, describe, expect, it, vi } from 'vitest';

const getExchangeFlows = vi.hoisted(() => vi.fn());

vi.mock('../duneAnalyticsService', () => ({
  duneAnalyticsService: { getExchangeFlows },
}));

vi.mock('../marketDataService', () => ({
  MarketDataService: {
    getInstance: () => ({}),
  },
}));

vi.mock('../onChainAnalyticsService', () => ({
  onChainAnalyticsService: {
    getRealTimeWhaleMovements: vi.fn(async () => []),
  },
}));

import {
  InstitutionalFlowService,
  normalizeExchangeFlow,
} from '../institutionalFlowService';

describe('institutional exchange-flow normalization', () => {
  beforeEach(() => {
    getExchangeFlows.mockReset();
  });

  it('normalizes aggregate inflow fields without inventing token quantity', () => {
    expect(
      normalizeExchangeFlow({
        exchange_name: 'Coinbase',
        token_symbol: 'BTC',
        inflow_24h: 15_000_000,
        outflow_24h: 5_000_000,
        net_flow_24h: 10_000_000,
        flow_change_percentage: 12,
        large_transactions: 4,
        timestamp: '2026-08-20T12:00:00.000Z',
      }),
    ).toEqual({
      to_exchange: 'Coinbase',
      symbol: 'BTC',
      amount: 0,
      value_usd: 10_000_000,
      timestamp: '2026-08-20T12:00:00.000Z',
    });
  });

  it('forwards 30d and emits a classified flow from a Dune aggregate fixture', async () => {
    getExchangeFlows.mockResolvedValue([
      {
        exchange_name: 'Coinbase',
        token_symbol: 'BTC',
        inflow_24h: 15_000_000,
        outflow_24h: 5_000_000,
        net_flow_24h: 10_000_000,
        flow_change_percentage: 12,
        large_transactions: 4,
        timestamp: '2026-08-20T12:00:00.000Z',
      },
    ]);
    const service = new InstitutionalFlowService();

    const flows = await service.getInstitutionalFundFlows('30d');

    expect(getExchangeFlows).toHaveBeenCalledWith(undefined, '30d');
    expect(flows).toHaveLength(1);
    expect(flows[0]).toMatchObject({
      sourceExchange: 'Unknown',
      destinationExchange: 'Coinbase',
      asset: 'BTC',
      amount: 0,
      value: 10_000_000,
      flowType: 'inflow',
      significance: 'moderate',
    });
  });
});