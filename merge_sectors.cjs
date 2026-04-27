const dbConfig = {
  client: 'sqlite3',
  connection: {
    filename: "./data_v17.sqlite"
  },
  useNullAsDefault: true
};

const knex = require('knex')(dbConfig);

async function mergeSectors() {
  try {
    console.log('Iniciando mesclagem dos setores Marketing e Comercial...');

    // 1. Criar novo setor ou renomear Marketing
    const targetSector = 'Marketing e Comercial';
    
    // Verifica se o alvo já existe
    const targetExists = await knex('budgets').where({ sector: targetSector }).first();
    
    if (!targetExists) {
      console.log(`Criando setor ${targetSector}...`);
      await knex('budgets').insert({ sector: targetSector, monthly_budget: 0, annual_budget: 0, spent: 0 });
      
      // Inicializar sazonalidade para o novo setor
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const initialSeasonality = months.map(m => ({ sector: targetSector, month: m, budget: 0, spent: 0 }));
      await knex('sector_seasonality').insert(initialSeasonality);
    }

    // 2. Somar orçamentos de Marketing e Comercial no novo setor
    const marketing = await knex('budgets').where({ sector: 'Marketing' }).first();
    const comercial = await knex('budgets').where({ sector: 'Comercial' }).first();

    if (marketing || comercial) {
      const totalMonthly = (marketing?.monthly_budget || 0) + (comercial?.monthly_budget || 0);
      const totalAnnual = (marketing?.annual_budget || 0) + (comercial?.annual_budget || 0);
      const totalSpent = (marketing?.spent || 0) + (comercial?.spent || 0);

      await knex('budgets').where({ sector: targetSector }).update({
        monthly_budget: totalMonthly,
        annual_budget: totalAnnual,
        spent: totalSpent
      });
    }

    // 3. Mesclar sazonalidade
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    for (const m of months) {
      const sMarketing = await knex('sector_seasonality').where({ sector: 'Marketing', month: m }).first();
      const sComercial = await knex('sector_seasonality').where({ sector: 'Comercial', month: m }).first();
      
      const totalBudget = (sMarketing?.budget || 0) + (sComercial?.budget || 0);
      const totalSpent = (sMarketing?.spent || 0) + (sComercial?.spent || 0);

      await knex('sector_seasonality').where({ sector: targetSector, month: m }).update({
        budget: totalBudget,
        spent: totalSpent
      });
    }

    // 4. Atualizar compras
    console.log('Atualizando solicitações de compra...');
    await knex('purchases').where({ sector: 'Marketing' }).update({ sector: targetSector });
    await knex('purchases').where({ sector: 'Comercial' }).update({ sector: targetSector });

    // 5. Atualizar usuários
    console.log('Atualizando setores dos usuários...');
    await knex('users').where({ sector: 'Marketing' }).update({ sector: targetSector });
    await knex('users').where({ sector: 'Comercial' }).update({ sector: targetSector });

    // 6. Remover setores antigos
    console.log('Removendo setores antigos...');
    await knex('budgets').whereIn('sector', ['Marketing', 'Comercial']).delete();
    await knex('sector_seasonality').whereIn('sector', ['Marketing', 'Comercial']).delete();

    console.log('Mesclagem concluída com sucesso!');
  } catch (err) {
    console.error('Erro na mesclagem:', err);
  } finally {
    await knex.destroy();
  }
}

mergeSectors();
