const create = {
  name: { type: 'string', required: true, minLen: 2 },
  description: { type: 'string' },
  parentId: { type: 'uuid' }
};

const update = {
  name: { type: 'string', minLen: 2 },
  description: { type: 'string' },
  parentId: { type: 'uuid' }
};

module.exports = { create, update };
