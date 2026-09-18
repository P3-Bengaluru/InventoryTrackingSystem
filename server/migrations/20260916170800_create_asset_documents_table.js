exports.up = function(knex) {
  return knex.schema.createTable('asset_documents', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('asset_id').notNullable();
    table.string('document_type', 50);
    table.string('original_filename', 255);
    table.string('stored_filename', 255);
    table.text('file_path').notNullable();
    table.string('mime_type', 100);
    table.bigint('file_size');
    table.uuid('uploaded_by').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('asset_id').references('assets.id');
    table.foreign('uploaded_by').references('users.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('asset_documents');
};