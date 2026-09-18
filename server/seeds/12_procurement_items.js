exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('procurement_items').del();
};