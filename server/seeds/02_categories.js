exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('categories').del()
    .then(function () {
      // Inserts seed entries
      return knex.transaction(function(trx) {
        // Insert top-level categories
        return trx('categories').insert([
          { id: knex.raw('uuid_generate_v4()'), name: 'Hardware', category_type: 'hardware', asset_prefix: 'HW', description: 'Hardware equipment', is_active: true },
          { id: knex.raw('uuid_generate_v4()'), name: 'Software', category_type: 'software', asset_prefix: 'SW', description: 'Software licenses and tools', is_active: true }
        ])
        .then(function() {
          // Now select the inserted rows by name
          return trx('categories').whereIn('name', ['Hardware', 'Software']).select('id', 'name');
        })
        .then(function(rows) {
          const categoryMap = {};
          rows.forEach(row => {
            categoryMap[row.name] = row.id;
          });

          // Insert child categories
          const children = [
            // Hardware children
            { name: 'Laptops', category_type: 'hardware', asset_prefix: 'LAP', description: 'Laptop computers', parent_id: categoryMap.Hardware },
            { name: 'Desktops', category_type: 'hardware', asset_prefix: 'DES', description: 'Desktop computers', parent_id: categoryMap.Hardware },
            { name: 'Monitors & Displays', category_type: 'hardware', asset_prefix: 'MON', description: 'Monitors and displays', parent_id: categoryMap.Hardware },
            { name: 'Peripherals', category_type: 'hardware', asset_prefix: 'PER', description: 'Peripheral devices', parent_id: categoryMap.Hardware },
            { name: 'Networking Equipment', category_type: 'hardware', asset_prefix: 'NET', description: 'Networking equipment', parent_id: categoryMap.Hardware },
            { name: 'Servers', category_type: 'hardware', asset_prefix: 'SRV', description: 'Servers', parent_id: categoryMap.Hardware },
            { name: 'Mobile Devices', category_type: 'hardware', asset_prefix: 'MOB', description: 'Mobile devices', parent_id: categoryMap.Hardware },
            { name: 'Test Benches', category_type: 'hardware', asset_prefix: 'TST', description: 'Test benches', parent_id: categoryMap.Hardware },
            { name: 'Other Hardware', category_type: 'hardware', asset_prefix: 'HW', description: 'Other hardware', parent_id: categoryMap.Hardware },
            // Software children
            { name: 'Operating Systems', category_type: 'software', asset_prefix: 'OS', description: 'Operating systems', parent_id: categoryMap.Software },
            { name: 'Productivity Suite', category_type: 'software', asset_prefix: 'PROD', description: 'Productivity suite software', parent_id: categoryMap.Software },
            { name: 'Security & Antivirus', category_type: 'software', asset_prefix: 'SEC', description: 'Security and antivirus software', parent_id: categoryMap.Software },
            { name: 'Development Tools', category_type: 'software', asset_prefix: 'DEV', description: 'Development tools', parent_id: categoryMap.Software },
            { name: 'Design Tools', category_type: 'software', asset_prefix: 'DSGN', description: 'Design tools', parent_id: categoryMap.Software },
            { name: 'Other Software', category_type: 'software', asset_prefix: 'SW', description: 'Other software', parent_id: categoryMap.Software }
          ];

          // Add is_active, created_at, updated_at
          const now = new Date();
          const seeds = children.map(child => ({
            id: knex.raw('uuid_generate_v4()'),
            name: child.name,
            category_type: child.category_type,
            asset_prefix: child.asset_prefix,
            description: child.description,
            parent_id: child.parent_id,
            is_active: true,
            created_at: now,
            updated_at: now
          }));

          return trx('categories').insert(seeds);
        });
      });
    });
};