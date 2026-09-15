const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');

async function getAll(filters = {}) {
  const query = db('customers').select('*');
  if (filters.is_active !== undefined) query.where({ is_active: filters.is_active });
  if (filters.search) {
    query.where(function () {
      this.whereILike('name', `%${filters.search}%`)
        .orWhereILike('customer_code', `%${filters.search}%`)
        .orWhereILike('contact_person', `%${filters.search}%`);
    });
  }
  query.orderBy('name', 'asc');
  return query;
}

async function getById(id) {
  const customer = await db('customers').where({ id }).first();
  if (!customer) throw new AppError('Customer not found', 404);
  return customer;
}

async function getAssets(customerId) {
  return db('assets')
    .select(
      'assets.id',
      'assets.asset_number',
      'assets.name',
      'assets.status',
      'assets.customer_reference',
      'assets.received_from_customer_date',
      'assets.photo_url',
      'categories.name as category_name'
    )
    .leftJoin('categories', 'assets.category_id', 'categories.id')
    .where({ 'assets.customer_id': customerId, 'assets.is_active': true })
    .orderBy('assets.name', 'asc');
}

async function create(data, req) {
  const existing = await db('customers').where({ name: data.name }).first();
  if (existing) throw new AppError('Customer name already exists', 409);
  if (data.customer_code) {
    const existingCode = await db('customers').where({ customer_code: data.customer_code }).first();
    if (existingCode) throw new AppError('Customer code already exists', 409);
  }
  const [customer] = await db('customers')
    .insert({
      name: data.name,
      customer_code: data.customer_code || null,
      contact_person: data.contact_person || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      notes: data.notes || null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('id');
  return getById(customer.id);
}

async function update(id, data, req) {
  const customer = await db('customers').where({ id }).first();
  if (!customer) throw new AppError('Customer not found', 404);
  const updateData = { updated_at: new Date() };
  const allowed = ['name', 'customer_code', 'contact_person', 'email', 'phone', 'address', 'city', 'notes', 'is_active'];
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  await db('customers').where({ id }).update(updateData);
  return getById(id);
}

async function deactivate(id, req) {
  await db('customers').where({ id }).update({ is_active: false, updated_at: new Date() });
  return { success: true };
}

module.exports = { getAll, getById, getAssets, create, update, deactivate };
