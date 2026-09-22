exports.up = async function (knex) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.string('employee_id', 50).notNullable().unique(); // company HR ID e.g. "EMP-1042"
    table.string('name', 100).notNullable();
    table.string('email', 150).notNullable().unique();
    table.string('password_hash', 255).notNullable();

    table.string('role', 20).notNullable().defaultTo('engineer');
    table.check(
      `role IN ('admin','inventory_manager','project_manager','manager','engineer','auditor')`,
      [],
      'users_role_check'
    );

    table.uuid('manager_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('department', 100);
    table.string('designation', 100);
    table.string('phone', 20);

    // Procurement authority
    table.decimal('self_approve_limit', 12, 2).notNullable().defaultTo(0);
    table.decimal('budget_limit', 12, 2).notNullable().defaultTo(0);

    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_login_at');
    table.integer('failed_login_attempts').notNullable().defaultTo(0);
    table.timestamp('locked_until');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('users', (table) => {
    table.index('employee_id', 'idx_users_employee_id');
    table.index('manager_id', 'idx_users_manager');
    table.index('role', 'idx_users_role');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');
};
