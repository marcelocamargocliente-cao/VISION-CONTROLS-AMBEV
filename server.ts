import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'ai_studio',
  host: 'db.hiaexzlqctlvibusuxoj.supabase.co',
  database: 'postgres',
  password: 'Vision@2026',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route para buscar os 194 equipamentos reais diretamente do banco
  app.get('/api/equipamentos', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          id,
          tag::text as tag,
          ug_codigo as ug_ref,
          area_nome as area_ref,
          COALESCE(sublocal, maquina, centro_trabalho) as localizacao_ref,
          patrimonio as patrimonio_ref,
          tipo_equipamento,
          marca,
          modelo,
          capacidade,
          'INDUSTRIAL' as aplicacao,
          status,
          COALESCE(centro_trabalho, ug_codigo) as local_instalacao,
          qr_slug
        FROM vw_equipamentos
        ORDER BY tag::int ASC
      `);
      res.json({ data: result.rows });
    } catch (error: any) {
      console.error('Erro na consulta de equipamentos no PostgreSQL:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
