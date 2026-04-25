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
    filename: "./data_v11.sqlite"
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
      table.decimal('allocated').defaultTo(0);
      table.decimal('spent').defaultTo(0);
    });

    // Initial sectors
    await knex('budgets').insert([
      { sector: 'Operação' }, { sector: 'Bilheteria' }, { sector: 'Manutenção' },
      { sector: 'Marketing' }, { sector: 'Comercial' }, { sector: 'Eventos' },
      { sector: 'Estação' }, { sector: 'Financeiro' }, { sector: 'TI' }
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
      { username: 'afonso', password: '123', name: 'Afonso', role: 'SECTOR_LEAD', sector: 'Manutenção' },
      { username: 'julio', password: '123', name: 'Julio', role: 'ADMIN', sector: 'Manutenção' },
      { username: 'felipe', password: '123', name: 'Felipe', role: 'SECTOR_LEAD', sector: 'Bilheteria' },
      { username: 'paula', password: '123', name: 'Paula', role: 'FINANCE', sector: 'Financeiro' },
      { username: 'juan', password: '123', name: 'Juan', role: 'FINANCE', sector: 'Financeiro' },
      { username: 'giovana', password: '123', name: 'Giovana', role: 'FINANCE', sector: 'Financeiro' },
      { username: 'leonardo', password: '123', name: 'Leonardo', role: 'SECTOR_LEAD', sector: 'Operação' },
      { username: 'veronica', password: '123', name: 'Veronica', role: 'SECTOR_LEAD', sector: 'Estação' },
      { username: 'grazi', password: '123', name: 'Grazi', role: 'SECTOR_LEAD', sector: 'Marketing' },
      { username: 'esther', password: '123', name: 'Esther', role: 'SECTOR_LEAD', sector: 'Comercial' },
      { username: 'ramon', password: '123', name: 'Ramon', role: 'SECTOR_LEAD', sector: 'Eventos' },
      { username: 'gustavo', password: '123', name: 'Gustavo', role: 'ADMIN', sector: 'TI' }
    ]);
  }

  const hasMonthlyBudgets = await knex.schema.hasTable('monthly_budgets');
  if (!hasMonthlyBudgets) {
    await knex.schema.createTable('monthly_budgets', (table) => {
      table.string('month').primary();
      table.decimal('budget').defaultTo(0);
      table.decimal('spent').defaultTo(0);
    });

    // Seed months with real-world empty starting state
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    await knex('monthly_budgets').insert(months.map(m => ({ 
      month: m, 
      budget: 0, 
      spent: 0 
    })));
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

// Update Budget
app.post('/api/budgets/update', async (req, res) => {
  const { sector, allocated } = req.body;
  await knex('budgets').where({ sector }).update({ allocated });
  res.json({ success: true });
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
    
    // Update monthly stats
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = monthNames[new Date().getMonth()];
    await knex('monthly_budgets').where({ month: currentMonth }).increment('spent', purchase.amount);
    
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

app.get('/api/stats/monthly', async (req, res) => {
  const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Pega a soma total de todos os budgets dos setores
  const totalAllocatedResult = await knex('budgets').sum('allocated as total');
  const totalAllocated = parseFloat(totalAllocatedResult[0].total || 0);

  const stats = await knex('monthly_budgets').select('*');
  
  // Ordena e injeta o budget real calculado
  const sortedStats = stats
    .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
    .map(s => ({
      ...s,
      allocated: totalAllocated // Usa o valor real dos setores
    }));
  
  res.json(sortedStats);
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
  const { sector, allocated } = req.body;
  await knex('budgets').insert({ 
    sector, 
    allocated: allocated || 0,
    spent: 0 
  });
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
