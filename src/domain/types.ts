export interface Medicine {
  id: string;
  name: string;
  salt: string;
  /** Whole rupees. */
  price: number;
  maxQty: number;
  rx: boolean;
}

/** What the cart persists: price, maxQty and rx are always read from the catalog. */
export interface CartLine {
  id: string;
  qty: number;
}

export interface ResolvedLine {
  medicine: Medicine;
  qty: number;
}

export interface Address {
  name: string;
  /** 10-digit Indian mobile number. */
  phone: string;
  /** House / flat, street and area. */
  line1: string;
  /** 6-digit Indian pincode. */
  pincode: string;
}
