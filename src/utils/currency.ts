/**
 * Formata um valor numérico para o formato de moeda brasileiro (R$ 1.234,56)
 */
export const formatCurrency = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d]/g, '')) / 100 : value;
  if (isNaN(numericValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
};

/**
 * Converte uma string formatada (ex: "1.234,56") em um número puro (1234.56)
 */
export const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0;
  // Remove tudo que não é dígito
  const cleanValue = value.replace(/[^\d]/g, '');
  // Divide por 100 para ter as casas decimais corretas
  return parseFloat(cleanValue) / 100;
};

/**
 * Máscara para input de moeda enquanto o usuário digita
 * Recebe o valor atual do input e retorna o valor formatado
 */
export const maskCurrency = (value: string): string => {
  // Remove tudo que não é dígito
  let cleanValue = value.replace(/[^\d]/g, '');
  
  // Se estiver vazio, retorna vazio
  if (!cleanValue) return '';

  // Converte para número e divide por 100
  const numberValue = parseInt(cleanValue, 10) / 100;
  
  // Formata de volta para BRL
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};
