import { productSaveError, validateProduct } from './productErrors';
const error = (detail, status = 422) => ({ response: { status, data: { detail } } });
test('explains actual PHP duplicate and field errors', () => {
  expect(productSaveError(error('slug_or_identifier_exists', 409))).toContain('már foglalt');
  expect(productSaveError(error('invalid_long_description'))).toContain('Hosszú leírás');
  expect(productSaveError(error('required_name'))).toContain('kötelező');
});
test('does not expose arbitrary backend error content', () => {
  expect(productSaveError(error('SQL password=secret', 500))).not.toContain('secret');
  expect(productSaveError(error('<script>alert(1)</script>', 500))).toContain('HTTP 500');
  expect(productSaveError(error('constructor', 500))).toContain('HTTP 500');
});
test('distinguishes access, size and network errors', () => {
  expect(productSaveError(error('', 401))).toContain('adminbelépés');
  expect(productSaveError(error('', 413))).toContain('Túl nagy');
  expect(productSaveError({})).toContain('Nem érkezett válasz');
});
test('accepts zero price and stock but rejects blank, fractional or negative values', () => {
  const p = { name: 'Gyertya 🕯️', category: 'candles', slug: 'gyertya', price: 0, stock: 0 };
  expect(validateProduct(p)).toBeNull();
  for (const price of ['', -1, '12.5', 'abc']) expect(validateProduct({ ...p, price })).toBe('invalid_price');
  expect(validateProduct({ ...p, name: ' ' })).toBe('required_name');
  expect(validateProduct({ ...p, stock: 10000001 })).toBe('invalid_stock');
});
