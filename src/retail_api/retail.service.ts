import { Injectable } from '@nestjs/common'
import { CrmType, Order, OrdersFilter, RetailPagination } from './types'
import axios, { AxiosInstance } from 'axios'
import { serialize } from '../tools'
import { plainToClass } from 'class-transformer'
import {OrdersResponse} from "../graphql"

@Injectable()
export class RetailService {
  private readonly axios: AxiosInstance

  constructor() {
    this.axios = axios.create({
      baseURL: `${process.env.RETAIL_URL}/api/v5`,
      timeout: 10000,
      headers: {'X-API-KEY': process.env.RETAIL_KEY}
    })

    this.axios.interceptors.request.use((config) => {
      return config
    })
    this.axios.interceptors.response.use(
      (resp) => {
        return resp
      },
      (resp) => {
        return resp
      },
    )
  }

  async orders(filter?: OrdersFilter): Promise<OrdersResponse> {
    const params = serialize(filter, '')
    const resp = await this.axios.get('/orders?' + params)
    if (!resp.data) throw new Error('RETAIL CRM ERROR')
    const orders = plainToClass(Order, resp.data.orders as Array<any>)
    const pagination: RetailPagination = resp.data.pagination

    return {orders, pagination}
  }

  async findOrder(id: string): Promise<Order | null> {
    const resp = await this.axios.get(`/orders/${id}?by=id`)
    if (!resp.data) throw new Error('RETAIL CRM ERROR')
    const orders = plainToClass(Order, resp.data.order)
    return orders
  }
  private async getRef({reference, key}: {reference: string, key: string}): Promise<CrmType[]> {
    const resp = await this.axios.get(`/reference/${reference}`)
    if (!resp.data) throw new Error('RETAIL CRM ERROR')
    const statuses = plainToClass(CrmType, resp.data[key] as Array<any>)
    return Object.values(statuses)
  }
  async orderStatuses(): Promise<CrmType[]> {
    return this.getRef({reference: 'statuses', key: 'statuses'})
  }

  async productStatuses(): Promise<CrmType[]> {
    return this.getRef({reference: 'product-statuses', key: 'productStatuses'})
  }

  async deliveryTypes(): Promise<CrmType[]> {
    return this.getRef({reference: 'delivery-types', key: 'deliveryTypes'})
  }
}
