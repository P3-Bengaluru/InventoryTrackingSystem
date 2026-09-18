exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('asset_assignments').del();
};