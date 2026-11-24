import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ketotongpovrlxbexafb.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldG90b25ncG92cmx4YmV4YWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1MTU1NzQsImV4cCI6MjExMTA5MTU3NH0.m3m4LYcYdzNa37Xo-iO4s67GJ0UYsfFmZEqrSePTNts';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).filter(l => l.trim().length > 0).map(line => {
    // Basic CSV parser handling standard comma-separated fields
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] !== undefined ? values[i] : null;
    });
    return obj;
  });
}

export async function importCSV(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(absolutePath, 'utf8');
  const rows = parseCSV(raw);
  console.log(`Parsed ${rows.length} rows from ${path.basename(filePath)}`);

  // 1. Get or create a default business
  let businessId = null;
  const { data: businesses, error: bizError } = await supabase.from('businesses').select('id').limit(1);
  if (bizError) {
    console.error('Error fetching businesses:', bizError.message);
  }

  if (businesses && businesses.length > 0) {
    businessId = businesses[0].id;
  } else {
    console.log('Creating default business for import...');
    const { data: newBiz, error: createBizError } = await supabase.from('businesses').insert({
      name: 'Sweet Delights Bakery',
      category: 'food_beverage',
      type: 'bakery',
      depot_name: 'Main Depot',
      depot_address: 'MG Road, Tumakuru, Karnataka',
      depot_lat: 13.3409,
      depot_lng: 77.1012,
    }).select().single();

    if (createBizError) {
      console.error('Could not create default business:', createBizError.message);
    } else {
      businessId = newBiz.id;
    }
  }

  let importedCount = 0;

  for (const row of rows) {
    // Upsert customer
    const customerName = row.customer_name || row.name || 'Valued Customer';
    const customerPhone = row.phone || '9876543210';
    const customerEmail = row.email || null;
    const customerAddress = row.address || 'Tumakuru, Karnataka';
    const customerLat = parseFloat(row.lat || '13.3409');
    const customerLng = parseFloat(row.lng || '77.1012');

    const { data: customer, error: custError } = await supabase.from('customers').insert({
      business_id: businessId,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      address: customerAddress,
      lat: customerLat,
      lng: customerLng,
    }).select().single();

    if (custError) {
      console.warn(`Customer insert warning for ${customerName}:`, custError.message);
      continue;
    }

    // Insert order
    const orderNumber = row.order_number || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const category = row.category || 'General';
    const weightKg = parseFloat(row.weight_kg || '1.0');
    const packageCount = parseInt(row.package_count || '1', 10);
    const priority = ['critical', 'high', 'normal', 'flexible'].includes(row.priority) ? row.priority : 'normal';
    const timeWindowStart = row.time_window_start || '09:00';
    const timeWindowEnd = row.time_window_end || '17:00';
    const serviceTimeMin = parseInt(row.service_time_minutes || '4', 10);

    const { error: orderError } = await supabase.from('orders').insert({
      business_id: businessId,
      customer_id: customer.id,
      order_number: orderNumber,
      category,
      weight_kg: weightKg,
      package_count: packageCount,
      priority,
      time_window_start: timeWindowStart,
      time_window_end: timeWindowEnd,
      service_time_minutes: serviceTimeMin,
      status: 'pending',
    });

    if (orderError) {
      console.error(`Order insert failed for ${orderNumber}:`, orderError.message);
    } else {
      importedCount++;
      console.log(`✓ Imported ${orderNumber} for ${customerName}`);
    }
  }

  console.log(`\nImport complete: ${importedCount} of ${rows.length} orders saved to Supabase.`);
}

const targetFile = process.argv[2] || 'orders_sample.csv';
importCSV(targetFile).catch(err => {
  console.error('Import error:', err);
  process.exit(1);
});
