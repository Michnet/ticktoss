import Dexie from 'dexie';

export const db = new Dexie('TickTossVendorDB');

db.version(1).stores({
  draftProducts: '++id, name, short_description, price, sale_price, stock, duration_hours, pickup_lat, pickup_lng, pickup_address, status' // Primary key and indexed props
});
