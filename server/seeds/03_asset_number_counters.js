exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('asset_number_counters').del()
    .then(function () {
      // Inserts seed entries
      return knex('asset_number_counters').insert([
        { prefix: 'LAP', next_number: 1 },
        { prefix: 'DES', next_number: 1 },
        { prefix: 'MON', next_number: 1 },
        { prefix: 'PER', next_number: 1 },
        { prefix: 'NET', next_number: 1 },
        { prefix: 'SRV', next_number: 1 },
        { prefix: 'MOB', next_number: 1 },
        { prefix: 'TST', next_number: 1 },
        { prefix: 'HW', next_number: 1 },
        { prefix: 'OS', next_number: 1 },
        { prefix: 'PROD', next_number: 1 },
        { prefix: 'SEC', next_number: 1 },
        { prefix: 'DEV', next_number: 1 },
        { prefix: 'DSGN', next_number: 1 },
        { prefix: 'SW', next_number: 1 }
      ]);
    });
};