exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('system_settings').del();
};