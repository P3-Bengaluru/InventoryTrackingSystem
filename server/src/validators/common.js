const idParam = {
  id: { type: 'uuid', required: true }
};

const pagination = {
  page: { type: 'number', default: 1, min: 1 },
  perPage: { type: 'number', default: 20, min: 1 }
};

module.exports = { idParam, pagination };
