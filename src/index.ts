import { Client } from './utils/bybit';
import * as dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';

// 加载环境变量
dotenv.config();
const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;
if (!apiKey || !apiSecret){
    console.error('API key or secret is not provided');
    process.exit(1);
}
const client = new Client(apiKey, apiSecret);
const symbolArray = ['XMRUSDT', 'SOLUSDT', 'AAVEUSDT', 'QNTUSDT', 'ORDIUSDT'];
const qtyStepArray = [0.01, 0.1, 0.01, 0.01, 0.01];
const leverageArray = [8.63636, 5.27777, 6.333333, 7.30769, 9.5];

const app = express();
const PORT = process.env.PORT || 80;

// 初始化，所有仓位平仓
for (let i = 0; i < symbolArray.length; i++){
    const symbol = symbolArray[i];
    client.order(symbol, 'Sell', "0", true);
    client.open = false;
}

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
    console.log(req.body);
    const data = req.body;
    const symbol = data.symbol;
    if (data.action === 'sell'){
        data.action = 'Sell';
    }
    else if (data.action === 'buy'){
        data.action = 'Buy';
    }
    const action = data.action;

    if (client.open){
        res.send('账户已开仓另一笔交易，请等待该笔交易结束。');
    }
    else if (!symbolArray.includes(symbol)){
        res.send('无效交易对');
    }
    else if (action !== 'Buy' && action !== 'Sell'){
        res.send('无效操作');
    }
    else {
        // 平仓
        if (action === 'Sell'){
            client.order(symbol, 'Sell', "0", true);
            client.open = false;
            console.log('已平多仓，货币对：', symbol);
            res.send('已平多仓');
        }
        else {
            // 基本信息
            const index = symbolArray.indexOf(symbol);
            const qtyStep = qtyStepArray[index];
            const leverage = leverageArray[index];
            const balance = Number(await client.getBalance('USDT'));
            // 计算仓位，注意用于计算仓位的本金（以500为基础），是以2的整数次幂为阶段递增递减的。
            // 例如如果此时本金为300，则计算本金为250，如果此时本金为1600，则计算本金为1000。
            let capital = 500;
            while (capital < balance){
                capital *= 2;
            }
            while (capital > balance){
                capital /= 2;
            }
            const currentPrice = Number(await client.getPrice(symbol));
            const qty = Math.floor((capital * leverage / currentPrice) / qtyStep) * qtyStep;
            // 开仓
            client.order(symbol, 'Buy', qty.toString(), false);
            client.open = true;
            console.log('已开多仓，货币对：', symbol, '数量：', qty);
            res.send('已开多仓');
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});