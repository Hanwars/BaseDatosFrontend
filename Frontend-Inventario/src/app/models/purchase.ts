export class Purchase {
    constructor(
        public purchase_id: number,
        public user_id: number,
        public user_name: string,
        public supplier_id: number,
        public supplier_name: string,
        public date: string,
        public subtotal: number,
        public discount: number,
        public iva: number,
        public total: number
    ){}
}

export class PurchaseDetail {
    constructor(
        public detail_id: number,
        public purchase_id: number,
        public supply_id: number,
        public supply_name: string,
        public quantity: number,
        public unit_price: number,
        public discount: number,
        public subtotal: number
    ){}
}
