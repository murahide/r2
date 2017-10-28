import 'reflect-metadata';
import QuoteAggregatorImpl from '../QuoteAggregatorImpl';
import { Broker, QuoteSide, QuoteAggregator } from '../type';
import * as _ from 'lodash';
import { delay } from '../util';
import BrokerAdapterRouterImpl from '../BrokerAdapterRouterImpl';

const config = {
  iterationInterval: 3000,
  priceMergeSize: 100,
  brokers: [{
    broker: Broker.Bitflyer,
    enabled: true
  }, {
    broker: Broker.Quoine,
    enabled: true,
    maxLongPosition: 0.3,
    maxShortPosition: 0.3
  }, {
    broker: Broker.Coincheck,
    enabled: true,
    maxLongPosition: 1,
    maxShortPosition: 0
  }]
};
const configStore = { config };

test('Test QuoteAggregatorImpl folding', async () => {
  configStore.config.iterationInterval = 10;
  const bitflyerBa = {
    broker: Broker.Bitflyer,
    fetchQuotes: () => Promise.resolve([
      { broker: Broker.Bitflyer, side: QuoteSide.Ask, price: 500000, volume: 0.1 },
      { broker: Broker.Bitflyer, side: QuoteSide.Ask, price: 500001, volume: 0.1 }
    ])
  };
  const coincheckBa = {
    broker: Broker.Coincheck,
    fetchQuotes: () => Promise.resolve([
      { broker: Broker.Coincheck, side: QuoteSide.Bid, price: 490001, volume: 0.02 },
      { broker: Broker.Coincheck, side: QuoteSide.Bid, price: 490000, volume: 0.2 }
    ])
  };
  const quoineBa = {
    broker: Broker.Quoine,
    fetchQuotes: () => Promise.resolve([])
  };
  const baList = [bitflyerBa, coincheckBa, quoineBa];
  const baRouter = new BrokerAdapterRouterImpl(baList);
  const aggregator: QuoteAggregator = new QuoteAggregatorImpl(configStore, baRouter);
  aggregator.onQuoteUpdated = async (quotes) => {
    expect(quotes.length).toBe(3);
  };
  await delay(0);
});

test('Test QuoteAggregatorImpl folding when a broker is disabled', async () => {
  configStore.config.iterationInterval = 11;
  config.brokers[0].enabled = false;
  const bitflyerBa = {
    broker: Broker.Bitflyer,
    fetchQuotes: () => Promise.resolve([
      { broker: Broker.Bitflyer, side: QuoteSide.Ask, price: 500000, volume: 0.1 },
      { broker: Broker.Bitflyer, side: QuoteSide.Ask, price: 500001, volume: 0.01 }
    ])
  };
  const coincheckBa = {
    broker: Broker.Coincheck,
    fetchQuotes: () => Promise.resolve([
      { broker: Broker.Coincheck, side: QuoteSide.Bid, price: 490001, volume: 0.02 },
      { broker: Broker.Coincheck, side: QuoteSide.Bid, price: 490000, volume: 0.2 }
    ])
  };
  const quoineBa = {
    broker: Broker.Quoine,
    fetchQuotes: () => Promise.resolve([])
  };
  const baList = [bitflyerBa, coincheckBa, quoineBa];
  const baRouter = new BrokerAdapterRouterImpl(baList);
  const aggregator: QuoteAggregator = new QuoteAggregatorImpl(configStore, baRouter);
  aggregator.onQuoteUpdated = async (quotes) => {
    expect(quotes.length).toBe(1);
  };
  await delay(0);
});

test('Test QuoteAggregatorImpl onQuoteUpdated', async () => {
  configStore.config.iterationInterval = 12;
  const bitflyerBa = {
    broker: Broker.Bitflyer,
    fetchQuotes: () => Promise.resolve([
      { broker: Broker.Bitflyer, side: QuoteSide.Ask, price: 500000, volume: 0.1 },
      { broker: Broker.Bitflyer, side: QuoteSide.Ask, price: 500001, volume: 0.01 }
    ])
  };
  const quoineBa = {
    broker: Broker.Quoine,
    fetchQuotes: () => Promise.resolve([])
  };
  const coincheckBa = {
    broker: Broker.Coincheck,
    fetchQuotes: () => Promise.resolve([])
  };
  const baList = [bitflyerBa, quoineBa, coincheckBa];
  const baRouter = new BrokerAdapterRouterImpl(baList);
  const aggregator: QuoteAggregator = new QuoteAggregatorImpl(configStore, baRouter);
  const fn = jest.fn();
  aggregator.onQuoteUpdated = fn;
  await delay(0);
  expect(fn.mock.calls.length).toBeGreaterThan(0);   
});