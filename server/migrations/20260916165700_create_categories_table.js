exports.up = function(knex) {
  return knex.schema.createTable('categories', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.uuid('parent_id').nullable();
    table.string('category_type', 30).notNullable();
    table.check("category_type IN ('hardware', 'software')");
    table.string('asset_prefix', 10).notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Self-referencing foreign key
    table.foreign('parent_id').references('categories.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('categories');
};