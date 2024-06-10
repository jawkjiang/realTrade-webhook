import * as bybit from 'bybit-api';

export class Client extends bybit.RestClientV5 {
  open: boolean;

  constructor(key: string, secret: string){
    super({
        key: key,
        secret: secret
    });
    this.open = false;
  }

  async getBalance(coin: string){
    try {
      const response = await this.getWalletBalance({
      accountType: 'UNIFIED',
      coin: coin
      });
      return response.result.list[0].coin[0].walletBalance;
    }
    catch(error){
      console.error('获取余额错误：', error);
      return undefined;
    }
  }

  async order(symbol: string, side: string, qty: string, reduceOnly: boolean, price=undefined){
    try {
      const response = await this.submitOrder({
        category: 'linear',
        symbol: symbol,
        side: side as bybit.OrderSideV5, // Convert side to OrderSideV5 type
        orderType: "Market",
        qty: qty,
        reduceOnly: reduceOnly,
        price: price
      });
      console.log(response.retMsg);
      if (response.retCode === 0){
        return response['result']['orderId'];
      }
      else {
        return undefined;
      }
    }
    catch(error){
      console.error('提交订单错误：', error);
      return undefined
    }
  }

  async getPrice(symbol: string){
    try {
      const response = await this.getTickers({
        category: 'linear',
        symbol: symbol
      });
      return response.result.list[0].lastPrice;
    }
    catch(error){
      console.error('获取价格错误：', error);
      return undefined;
    }
  }

  async getOrder(symbol: string, orderId: string){
    try {
      const response = await this.getActiveOrders({
        category: 'linear',
        symbol: symbol,
        orderId: orderId
      });
      if (response.result.list.length > 0){
        return response.result.list[0];
      }
      else {
        return undefined;
      }   
    }
    catch(error){
      console.error('获取订单错误：', error);
      return undefined;
    }
  }

  async deleteOrder(symbol: string){
    try {
      const response = await this.cancelAllOrders({
        category: 'linear',
        symbol: symbol,
      });
      return response.retMsg;
    }
    catch(error){
      console.error('取消订单错误：', error);
      return undefined;
    }
  }
}

