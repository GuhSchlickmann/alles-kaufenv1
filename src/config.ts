// Configuração de conexão com o servidor oficial no Render
const IS_PROD = true; // Forçamos produção para o executável EXE conectar no cloud

export const API_URL = IS_PROD 
  ? 'https://alles-kaufen-system.onrender.com/api' 
  : 'http://localhost:3001/api';
