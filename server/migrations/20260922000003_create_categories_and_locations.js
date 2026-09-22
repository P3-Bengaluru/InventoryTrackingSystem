exports.up = async function (knex) {
  // ── Categories (self-referencing, for sub-categories) ──────────────
  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.uuid('parent_id').references('id').inTable('categories').onDelete('RESTRICT');
    table.string('type', 20); // only set on root category
    table.text('description');
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['name', 'parent_id']);
    table.check(`type IN ('asset','consumable')`, [], 'categories_type_check');
  });

  await knex.schema.alterTable('categories', (table) => {
    table.index('parent_id', 'idx_categories_parent');
  });

  // ── Locations (3-level: City -> Department -> Project) ─────────────
  await knex.schema.createTable('locations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 150).notNullable();
    table.uuid('parent_id').references('id').inTable('locations').onDelete('RESTRICT');
    table.smallint('level').notNullable(); // 1=City, 2=Department, 3=Project
    table.string('code', 30);
    table.text('address'); // only on City level
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['name', 'parent_id']);
    table.check(`level IN (1,2,3)`, [], 'locations_level_check');
  });

  await knex.schema.alterTable('locations', (table) => {
    table.index('parent_id', 'idx_locations_parent');
    table.index('level', 'idx_locations_level');
  });

  // Helper view: full path label for any location
  await knex.raw(`
    CREATE VIEW location_full_path AS
    WITH RECURSIVE loc_tree AS (
        SELECT id, name, parent_id, level, code,
               name::TEXT AS full_path
        FROM   locations WHERE parent_id IS NULL
        UNION ALL
        SELECT l.id, l.name, l.parent_id, l.level, l.code,
               lt.full_path || ' › ' || l.name
        FROM   locations l
        JOIN   loc_tree lt ON l.parent_id = lt.id
    )
    SELECT id, name, level, code, full_path FROM loc_tree
  `);
};

exports.down = async function (knex) {
  await knex.raw('DROP VIEW IF EXISTS location_full_path');
  await knex.schema.dropTableIfExists('locations');
  await knex.schema.dropTableIfExists('categories');
};
