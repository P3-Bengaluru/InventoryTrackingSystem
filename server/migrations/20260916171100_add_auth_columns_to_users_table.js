exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('locked_until').nullable();
    table.timestamp('last_login_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('failed_login_attempts');
    table.dropColumn('locked_until');
    table.dropColumn('last_login_at');
  });
};
