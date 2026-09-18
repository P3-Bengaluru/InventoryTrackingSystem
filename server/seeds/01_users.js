const bcrypt = require('bcryptjs');

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {
          id: knex.raw('uuid_generate_v4()'),
          employee_id: 'EMP001',
          name: 'Administrator',
          email: 'admin@example.com',
          phone: '1234567890',
          password_hash: bcrypt.hashSync('password', 8),
          role: 'admin',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    });
};