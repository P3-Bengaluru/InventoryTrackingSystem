const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');

async function getAll(filters = {}) {
  const query = db('suppliers').select('*');
  if (filters.is_active !== undefined) query.where({ is_active: filters.is_active });
  if (filters.search) {
    query.where(function () {
      this.whereILike('name', `%${filters.search}%`)
        .orWhereILike('contact_person', `%${filters.search}%`)
        .orWhereILike('email', `%${filters.search}%`);
    });
  }
  query.orderBy('name', 'asc');
  return query;
}

async function getById(id) {
  const supplier = await db('suppliers').where({ id }).first();
  if (!supplier) throw new AppError('Supplier not found', 404);
  return supplier;
}

async function create(data, req) {
  const existing = await db('suppliers').where({ name: data.name }).first();
  if (existing) throw new AppError('Supplier name already exists', 409);
  const [supplier] = await db('suppliers')
    .insert({
      name: data.name,
      contact_person: data.contact_person || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      website: data.website || null,
      gstin: data.gstin || null,
      payment_terms: data.payment_terms || null,
      notes: data.notes || null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('id');
  return getById(supplier.id);
}

async function update(id, data, req) {
  const supplier = await db('suppliers').where({ id }).first();
  if (!supplier) throw new AppError('Supplier not found', 404);
  const updateData = { updated_at: new Date() };
  const allowed = ['name', 'contact_person', 'email', 'phone', 'address', 'city', 'website', 'gstin', 'payment_terms', 'notes', 'is_active'];
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  await db('suppliers').where({ id }).update(updateData);
  return getById(id);
}

async function deactivate(id, req) {
  await db('suppliers').where({ id }).update({ is_active: false, updated_at: new Date() });
  return { success: true };
}

module.exports = { getAll, getById, create, update, deactivate };
