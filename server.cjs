process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, 'dist')));
const dbConfig = process.env.DATABASE_URL ? {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false 
    }
  },
  pool: { min: 2, max: 10 }
} : {
  client: 'sqlite3',
  connection: {
    filename: "./data_v17.sqlite"
  },
  useNullAsDefault: true
};

const knex = require('knex')(dbConfig);

// Initialize Database
async function initDb() {
  const hasPurchases = await knex.schema.hasTable('purchases');
  if (!hasPurchases) {
    await knex.schema.createTable('purchases', (table) => {
      table.increments('id').primary();
      table.string('productName');
      table.text('productLink');
      table.text('description');
      table.decimal('amount');
      table.string('sector');
      table.string('requestedBy');
      table.string('status').defaultTo('PENDING');
      table.text('rejectionReason');
      table.string('paymentMethod');
      table.date('dueDate');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
    });
  } else {
    // Check if productLink column exists
    const hasProductLink = await knex.schema.hasColumn('purchases', 'productLink');
    if (!hasProductLink) {
      await knex.schema.table('purchases', (table) => {
        table.text('productLink');
      });
    } else {
      // Força a mudança para TEXT caso o link seja muito longo (Amazon etc)
      await knex.schema.table('purchases', (table) => {
        table.text('productLink').alter();
      });
    }
  }

  const hasBudgets = await knex.schema.hasTable('budgets');
  if (!hasBudgets) {
    await knex.schema.createTable('budgets', (table) => {
      table.string('sector').primary();
      table.decimal('monthly_budget').defaultTo(0);
      table.decimal('annual_budget').defaultTo(0);
      table.decimal('spent').defaultTo(0);
    });

    // Initial sectors
    await knex('budgets').insert([
      { sector: 'Operação', monthly_budget: 0, annual_budget: 0 },
      { sector: 'Bilheteria', monthly_budget: 0, annual_budget: 0 },
      { sector: 'Manutenção', monthly_budget: 0, annual_budget: 0 },
      { sector: 'Financeiro', monthly_budget: 0, annual_budget: 0 },
      { sector: 'Marketing', monthly_budget: 0, annual_budget: 0 },
      { sector: 'Comercial', monthly_budget: 0, annual_budget: 0 },
      { sector: 'Eventos', monthly_budget: 0, annual_budget: 0 },
      { sector: 'Estação', monthly_budget: 0, annual_budget: 0 },
      { sector: 'TI', monthly_budget: 0, annual_budget: 0 }
    ]);
  }

  const hasUsers = await knex.schema.hasTable('users');
  if (!hasUsers) {
    await knex.schema.createTable('users', (table) => {
      table.string('username').primary();
      table.string('password').notNullable();
      table.string('name').notNullable();
      table.string('role').notNullable();
      table.string('sector').notNullable();
      table.boolean('mustChangePassword').defaultTo(true);
    });

    // Seed users
    await knex('users').insert([
      { username: 'afonso', password: '123', name: 'Afonso', role: 'LEADER', sector: 'Manutenção' },
      { username: 'julio', password: '123', name: 'Julio', role: 'LEADER', sector: 'Manutenção' },
      { username: 'felipe', password: '123', name: 'Felipe', role: 'LEADER', sector: 'Bilheteria' },
      { username: 'paula', password: '123', name: 'Paula', role: 'FINANCE', sector: 'Financeiro' },
      { username: 'juan', password: '123', name: 'Juan', role: 'FINANCE', sector: 'Financeiro' },
      { username: 'giovana', password: '123', name: 'Giovana', role: 'FINANCE', sector: 'Financeiro' },
      { username: 'leonardo', password: '123', name: 'Leonardo', role: 'LEADER', sector: 'Operação' },
      { username: 'veronica', password: '123', name: 'Veronica', role: 'LEADER', sector: 'Estação' },
      { username: 'grazi', password: '123', name: 'Grazi', role: 'LEADER', sector: 'Marketing' },
      { username: 'esther', password: '123', name: 'Esther', role: 'LEADER', sector: 'Comercial' },
      { username: 'ramon', password: '123', name: 'Ramon', role: 'LEADER', sector: 'Eventos' },
      { username: 'gustavo', password: '123', name: 'Gustavo', role: 'ADMIN', sector: 'TI' }
    ]);
  }

  const hasSeasonality = await knex.schema.hasTable('sector_seasonality');
  if (!hasSeasonality) {
    await knex.schema.createTable('sector_seasonality', (table) => {
      table.string('sector');
      table.string('month');
      table.decimal('budget').defaultTo(0);
      table.decimal('spent').defaultTo(0);
      table.primary(['sector', 'month']);
    });

    // Seed months with real-world empty starting state
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const sectors = ['Operação', 'Bilheteria', 'Manutenção', 'Financeiro', 'Marketing', 'Comercial', 'Eventos', 'Estação', 'TI'];
    
    const initialSeasonality = [];
    sectors.forEach(s => {
      months.forEach(m => {
        initialSeasonality.push({ sector: s, month: m, budget: 0, spent: 0 });
      });
    });
    await knex('sector_seasonality').insert(initialSeasonality);
  }

  const hasNotifications = await knex.schema.hasTable('notifications');
  if (!hasNotifications) {
    await knex.schema.createTable('notifications', (table) => {
      table.increments('id').primary();
      table.string('user').notNullable(); // Quem vai receber
      table.string('title').notNullable();
      table.string('message').notNullable();
      table.boolean('read').defaultTo(false);
      table.timestamp('createdAt').defaultTo(knex.fn.now());
    });
  }
}

initDb();

// Auth Endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await knex('users').where({ username, password }).first();
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

// Update Budget (Anual e Sazonal do Mês Atual) - Reforçado para Cloud
app.post('/api/budgets/update', async (req, res) => {
  const { sector, monthly_budget, annual_budget } = req.body;
  
  try {
    if (annual_budget !== undefined && !isNaN(annual_budget)) {
      // Garantir que o registro existe antes de dar update
      const exists = await knex('budgets').where({ sector }).first();
      if (exists) {
        await knex('budgets').where({ sector }).update({ annual_budget });
      } else {
        await knex('budgets').insert({ sector, annual_budget, spent: 0 });
      }
    }

    if (monthly_budget !== undefined && !isNaN(monthly_budget)) {
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const currentMonth = monthNames[new Date().getMonth()];
      
      // Upsert para Sazonalidade
      const seaExists = await knex('sector_seasonality').where({ sector, month: currentMonth }).first();
      if (seaExists) {
        await knex('sector_seasonality').where({ sector, month: currentMonth }).update({ budget: monthly_budget });
      } else {
        await knex('sector_seasonality').insert({ sector, month: currentMonth, budget: monthly_budget, spent: 0 });
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('ERRO CRÍTICO NO UPDATE:', err);
    res.status(500).json({ error: 'Erro de banco de dados. Tente novamente.' });
  }
});

// Rota para resetar senha de usuário (Padrão: 123)
app.post('/api/admin/reset-password', async (req, res) => {
  const { username } = req.body;
  await knex('users')
    .where({ username })
    .update({ 
      password: '123',
      mustChangePassword: 1 
    });
  res.json({ success: true });
});

// Rota especializada para o Painel Admin ver o resumo dos setores
app.get('/api/admin/sectors', async (req, res) => {
  const now = new Date();
  const monthIndex = now.getMonth();
  const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const targetMonth = monthsShort[monthIndex];

  const sectors = await knex('budgets').select('*');
  const seasonality = await knex('sector_seasonality').where('month', 'like', `${targetMonth}%`);

  const merged = sectors.map(s => {
    const sea = seasonality.find(m => m.sector === s.sector);
    return {
      ...s,
      current_month_budget: sea ? sea.budget : 0
    };
  });

  res.json(merged);
});

app.get('/api/purchases', async (req, res) => {
  const purchases = await knex('purchases').select('*').orderBy('createdAt', 'desc');
  res.json(purchases);
});

app.post('/api/purchases', async (req, res) => {
  console.log("--- NOVA SOLICITAÇÃO RECEBIDA ---");
  console.log("Body:", JSON.stringify(req.body, null, 2));
  
  const { productName, description, amount, sector, requestedBy, paymentMethod, dueDate, productLink } = req.body;
  
  const [id] = await knex('purchases').insert({
    productName, description, amount, sector, requestedBy, paymentMethod, dueDate, productLink
  });

  // Notificar FINANCE e ADMIN sobre nova solicitação
  const admins = await knex('users').whereIn('role', ['ADMIN', 'FINANCE']).select('username');
  for (const admin of admins) {
    await knex('notifications').insert({
      user: admin.username,
      title: 'Nova Solicitação',
      message: `${requestedBy} solicitou ${productName} (R$ ${amount.toLocaleString()})`
    });
  }

  console.log("SALVO COM SUCESSO. ID:", id);
  res.json({ id, status: 'PENDING' });
});

app.get('/api/budgets', async (req, res) => {
  const budgets = await knex('budgets').select('*');
  res.json(budgets);
});

app.patch('/api/purchases/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  
  await knex('purchases').where({ id }).update({ 
    status, 
    rejectionReason: status === 'REJECTED' ? rejectionReason : null 
  });

  if (status === 'APPROVED') {
    const purchase = await knex('purchases').where({ id }).first();
    await knex('budgets').where({ sector: purchase.sector }).increment('spent', purchase.amount);
    
    // Update monthly stats (Sazonalidade por Setor)
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = monthNames[new Date().getMonth()];
    
    await knex('sector_seasonality')
      .where({ sector: purchase.sector, month: currentMonth })
      .increment('spent', purchase.amount);

    // Verificar se o budget mensal está próximo do fim ou estourou
    const sea = await knex('sector_seasonality')
      .where({ sector: purchase.sector, month: currentMonth })
      .first();

    const remaining = sea.budget - sea.spent;

    if (remaining <= 500 && remaining > 0) {
      await knex('notifications').insert({
        user: purchase.requestedBy, 
        title: '⚠️ Orçamento Quase no Fim',
        message: `Seu orçamento de ${currentMonth} para ${purchase.sector} está acabando! Restam R$ ${remaining.toLocaleString()}.`
      });
    } else if (remaining <= 0) {
      await knex('notifications').insert({
        user: purchase.requestedBy,
        title: '🚫 Orçamento Excedido',
        message: `O orçamento de ${currentMonth} do setor ${purchase.sector} foi excedido com esta compra.`
      });
    }
    
    // Notificar solicitante sobre aprovação
    await knex('notifications').insert({
      user: purchase.requestedBy,
      title: 'Solicitação Aprovada',
      message: `Sua solicitação de ${purchase.productName} foi aprovada pelo financeiro.`
    });
  } else if (status === 'REJECTED') {
    // Notificar solicitante sobre recusa
    await knex('notifications').insert({
      user: purchase.requestedBy,
      title: 'Solicitação Recusada',
      message: `Sua solicitação de ${purchase.productName} foi recusada. Motivo: ${rejectionReason}`
    });
  }

  res.json({ success: true });
});

app.get('/api/seasonality/:sector', async (req, res) => {
  const { sector } = req.params;
  const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  let stats;
  if (sector === 'ALL' || sector === 'TODOS') {
    // Agrupa e soma por mês
    stats = await knex('sector_seasonality')
      .select('month')
      .sum('budget as budget')
      .sum('spent as spent')
      .groupBy('month');
  } else {
    stats = await knex('sector_seasonality').where({ sector }).select('*');
  }
  
  const sortedStats = stats.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
  res.json(sortedStats);
});

app.post('/api/seasonality/update', async (req, res) => {
  const { sector, month, budget } = req.body;
  await knex('sector_seasonality').where({ sector, month }).update({ budget });
  res.json({ success: true });
});

app.post('/api/users/change-password', async (req, res) => {
  const { username, newPassword } = req.body;
  await knex('users').where({ username }).update({ 
    password: newPassword, 
    mustChangePassword: false 
  });
  res.json({ success: true });
});

app.get('/api/users', async (req, res) => {
  const users = await knex('users').select('username', 'name', 'role', 'sector');
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const { username, password, name, role, sector } = req.body;
  await knex('users').insert({ 
    username, 
    password, 
    name, 
    role, 
    sector,
    mustChangePassword: true 
  });
  res.json({ success: true });
});

app.get('/api/sectors', async (req, res) => {
  const sectors = await knex('budgets').select('sector');
  res.json(sectors);
});

app.post('/api/sectors', async (req, res) => {
  const { sector, monthly_budget, annual_budget } = req.body;
  await knex('budgets').insert({ 
    sector, 
    monthly_budget: monthly_budget || 0,
    annual_budget: annual_budget || 0,
    spent: 0 
  });

  // Inicializar Sazonalidade para o novo setor
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const initialSeasonality = monthNames.map(m => ({
    sector,
    month: m,
    budget: 0,
    spent: 0
  }));
  await knex('sector_seasonality').insert(initialSeasonality);

  res.json({ success: true });
});

app.get('/api/notifications/:username', async (req, res) => {
  const { username } = req.params;
  const notifications = await knex('notifications')
    .where({ user: username })
    .orderBy('createdAt', 'desc')
    .limit(10);
  res.json(notifications);
});

app.post('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  await knex('notifications').where({ id }).update({ read: true });
  res.json({ success: true });
});

app.delete('/api/notifications/:username', async (req, res) => {
  const { username } = req.params;
  await knex('notifications').where({ user: username }).delete();
  res.json({ success: true });
});

app.delete('/api/sectors/:sector', async (req, res) => {
  const { sector } = req.params;
  // Opcional: Impedir de excluir setores que tem compras atreladas
  const hasPurchases = await knex('purchases').where({ sector }).first();
  if (hasPurchases) {
    return res.status(400).json({ error: 'Não é possível excluir um setor que possui solicitações de compra.' });
  }
  await knex('budgets').where({ sector }).delete();
  res.json({ success: true });
});

app.delete('/api/purchases/:id', async (req, res) => {
  const { id } = req.params;
  
  // Optionally subtract from budget
  const purchase = await knex('purchases').where({ id }).first();
  if (purchase) {
    if (purchase.status === 'APPROVED') {
      await knex('budgets').where({ sector: purchase.sector }).decrement('spent', purchase.amount);
      
      // Update monthly stats
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const currentMonth = monthNames[new Date().getMonth()];
      await knex('monthly_budgets').where({ month: currentMonth }).decrement('spent', purchase.amount);
    }
    await knex('purchases').where({ id }).del();
  }
  
  res.json({ success: true });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
