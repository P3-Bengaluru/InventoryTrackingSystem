const create = {
  name: { type: 'string', required: true, minLen: 2 },
  company: { type: 'string' },
  email: { type: 'email' },
  phone: { type: 'string' },
  address: { type: 'string' }
};

const update = {
  name: { type: 'string', minLen: 2 },
  company: { type: 'string' },
  email: { type: 'email' },
  phone: { type: 'string' },
  address: { type: 'string' }
};

module.exports = { create, update };
