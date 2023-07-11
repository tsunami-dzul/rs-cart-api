import { Client } from 'pg';
import { v4 } from 'uuid';
import { Injectable } from '@nestjs/common';

import { Cart } from '../models';

@Injectable()
export class CartService {
  private userCarts: Record<string, Cart> = {};
  private client = null;

  constructor() {
    this.client = new Client();
  }

  findByUserId(userId: string): Cart {
    const userCart = {
      id: '',
      items: []
    };
    const query = {
      text: 'select ca.id, ci.cart_id, ci.product_id, ci.count  from carts ca inner join cart_items ci on ca.id = ci.cart_id where user_id = $1',
      values: userId
    }  

    this.client.query(query, (err, res) => {
      if(err) {
        console.log(err);

        return;
      }

      this.client.end;
      
      let items = [];
      for(let i=0;i<res.length; i++) {
        items.push({
          product_id: res[i].product_id,
          count: res[i].count,
        });
      }

      userCart.id = res[0].id;
      userCart.items = items;

      this.userCarts[userId] = userCart;

      return this.userCarts[userId];
    });

    return;
  }

  createByUserId(userId: string) {
    const text = 'insert into carts(id, user_id, created_at, updated_at, state) values($1, $2, $2, $3, $4, $5)';
    const values = [v4(v4()), v4(v4()), new Date(), new Date(), 'OPEN'];

    this.client.query(text, values, (err, res) => {
      if(err) {
        console.log(err);

        return;
      }

      const userCart = {
        id: res[0].id,
        items: [],
      };
  
      this.userCarts[ userId ] = userCart;
  
      return userCart;
    });

    return {
      id: '',
      items: []
    };
  }

  findOrCreateByUserId(userId: string): Cart {
    const userCart = this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  updateByUserId(userId: string, { items }: Cart): Cart {
    const cartByUser = this.findByUserId(userId);

    for(let item of items) {
      const text = 'update cart_items set product_id=$1, count=$2 where cart_id=$3';
      const values = [item.product.id, item.count, cartByUser.id];

      this.client.query(text, values, (err, res) => {
        if(err) {
          console.log(err);

          return;
        }

        const updatedCart = {
          id: res.id,
          items: [ ...items ],
        }

        this.userCarts[ userId ] = { ...updatedCart };

        return { ...updatedCart };
      });

      return;
    }
  }

  removeByUserId(userId): void {
    const text = 'delete from carts where user_id = $1';
    const values = [userId];

    this.client.query(text, values, (err, res) => {
      if(err) {
        console.log(err);

        return;
      }

      this.userCarts[ userId ] = null;
    });    
  }

}
