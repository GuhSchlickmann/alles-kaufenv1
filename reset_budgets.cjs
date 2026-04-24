const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: './data_v10.sqlite' },
  useNullAsDefault: true
});

async function resetBudgets() {
  // Zera todos os orçamentos alocados para garantir que o gráfico comece do zero
  await knex('budgets').update({ allocated: 0 });
  console.log('Orçamentos zerados com sucesso!');
  process.exit(0);
}

resetBudgets();
