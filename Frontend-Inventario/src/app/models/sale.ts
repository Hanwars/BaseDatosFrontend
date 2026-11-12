export class Sale {
  constructor(
    public sale_id: number,
    public user_id: number,
    public user_name: string,
    public client_id: number,
    public client_name: string,
    public date: string,
    public subtotal: number,
    public discount: number,
    public iva: number,
    public total: number
  ) {}
}

export class SaleDetail {
  constructor(
    public detail_id: number,
    public sale_id: number,
    public supply_id: number,
    public supply_name: string,
    public quantity: number,
    public unit_price: number,
    public discount: number,
    public subtotal: number
  ) {}
}
