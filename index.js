require("dotenv").config();
const ccxt = require("ccxt");

const Combinations = (marketSymbols, base) => {
    let combinations = [];
    for (const sym1 of marketSymbols) {
        // 'BTC/USDT'
        const [sym1Base, sym1Quote] = sym1.split("/");
        // USDT === USDT
        if (sym1Quote == base) {
            for (const sym2 of marketSymbols) {
                // 'BTC/USDT'
                const [sym2Base, sym2Quote] = sym2.split("/");
                // BTC === BTC
                if (sym1Base == sym2Quote) {
                    for (const sym3 of marketSymbols) {
                        const [sym3Base, sym3Quote] = sym3.split("/");
                        if (sym2Base == sym3Base && sym3Quote == sym1Quote) {
                            const combination = {
                                base: sym1Quote,
                                intermediate: sym1Base,
                                ticker: sym2Base,
                            };
                            combinations.push(combination);
                        }
                    }
                }
            }
        }
    }
    console.log('avaiable', base,'paths',combinations.length);
    return combinations;
};
const Start = async () => {
    for (const exchangeRec of process.env.EXCHANGES.split(" ")) {
        const exchange = new ccxt[exchangeRec.toLowerCase()]({
            apiKey: process.env[`${exchangeRec}_API`],
            secret: process.env[`${exchangeRec}_SECRET`],
        });
        console.log('use', exchangeRec, 'for arb')
        const marketSymbols = (await exchange.fetchMarkets()).map((item) => item.symbol.toUpperCase());
        const combinations = Combinations(marketSymbols, process.env.BASE);
        let c = 0;
        for (const tickers of combinations) {
            const res1 = await exchange.fetchTicker(`${tickers.intermediate}/${tickers.base}`);
            const res2 = await exchange.fetchTicker(`${tickers.ticker}/${tickers.intermediate}`);
            const res3 = await exchange.fetchTicker(`${tickers.ticker}/${tickers.base}`);
            console.log(`check [${tickers.intermediate}/${tickers.base}] [${tickers.ticker}/${tickers.intermediate}] [${tickers.ticker}/${tickers.base}]`);
            if (res1.ask && res2.ask && res3.bid && (((process.env.TRADING_AMOUNT / res1.ask / res2.ask) * res3.bid - process.env.TRADING_AMOUNT) / process.env.TRADING_AMOUNT) * 100 > process.env.MIN_PERCENTAGE_PROF) {
                console.log(`Route: ${tickers.base} ==> ${tickers.intermediate} ==> ${tickers.ticker} ==> ${tickers.base}\nProfit: ${(((process.env.TRADING_AMOUNT / res1.ask / res2.ask) * res3.bid - process.env.TRADING_AMOUNT) / process.env.TRADING_AMOUNT) * 100} %`);
            }
            if (res1.bid && res2.bid && res3.ask && (((process.env.TRADING_AMOUNT / res3.ask) * res2.bid * res1.bid - process.env.TRADING_AMOUNT) / process.env.TRADING_AMOUNT) * 100 > process.env.MIN_PERCENTAGE_PROF) {
                console.log(`Route: ${tickers.base} ==> ${tickers.ticker} ==> ${tickers.intermediate} ==> ${tickers.base}\nProfit: ${(((process.env.TRADING_AMOUNT / res3.ask) * res2.bid * res1.bid - process.env.TRADING_AMOUNT) / process.env.TRADING_AMOUNT) * 100} %`);
            }
            console.log(c);
            c++;
        }
        console.log('last string');
    }
};
Start();

