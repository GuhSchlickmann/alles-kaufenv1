// Configuração de conexão com o servidor oficial no Render
// Configuração dinâmica: Local se estiver no navegador localhost, Nuvem se for o EXE ou Produção
const IS_PROD = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.includes('192.168.');


export const API_URL = IS_PROD 
  ? 'https://alles-kaufen-system.onrender.com/api' 
  : 'http://localhost:3001/api';
