exports.up = async function (knex) {
  await knex.schema.createTable('suppliers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 150).notNullable().unique();
    table.string('contact_person', 100);
    table.string('email', 150);
    table.string('phone', 30);
    table.text('address');
    table.string('city', 100);
    table.string('website', 255);
    table.string('gstin', 20); // GST registration number (India)
    table.string('payment_terms', 100); // e.g. "Net 30"
    table.text('notes');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('suppliers');
};
