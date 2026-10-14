import { Address } from './types';

export type AddressField = keyof Address;
export type AddressErrors = Partial<Record<AddressField, string>>;

export type AddressValidation =
  | { valid: true; address: Address }
  | { valid: false; errors: AddressErrors };

/** Trims every field and checks it; the returned address is the trimmed one. */
export function validateAddress(input: Address): AddressValidation {
  const address: Address = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    line1: input.line1.trim(),
    pincode: input.pincode.trim(),
  };
  const errors: AddressErrors = {};

  if (address.name.length < 2) {
    errors.name = 'Enter the receiver’s name';
  }
  if (!/^[6-9]\d{9}$/.test(address.phone)) {
    errors.phone = 'Enter a valid 10-digit mobile number';
  }
  if (address.line1.length < 5) {
    errors.line1 = 'Enter your house / flat, street and area';
  }
  if (!/^[1-9]\d{5}$/.test(address.pincode)) {
    errors.pincode = 'Enter a valid 6-digit pincode';
  }

  return Object.keys(errors).length === 0
    ? { valid: true, address }
    : { valid: false, errors };
}
