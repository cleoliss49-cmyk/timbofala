export const COMPANY_CATEGORIES = [
  { value: 'tecnologia', label: 'Tecnologia', icon: '💻', description: 'Software, TI, Startups' },
  { value: 'industria', label: 'Indústria', icon: '🏭', description: 'Manufatura, Produção' },
  { value: 'comercio', label: 'Comércio', icon: '🛒', description: 'Varejo, Atacado, Lojas' },
  { value: 'servicos', label: 'Serviços', icon: '🔧', description: 'Prestação de Serviços' },
  { value: 'saude', label: 'Saúde', icon: '🏥', description: 'Clínicas, Hospitais, Farmácias' },
  { value: 'educacao', label: 'Educação', icon: '📚', description: 'Escolas, Cursos, Treinamentos' },
  { value: 'alimentacao', label: 'Alimentação', icon: '🍽️', description: 'Restaurantes, Bares, Cafés' },
  { value: 'construcao', label: 'Construção', icon: '🏗️', description: 'Engenharia, Arquitetura' },
  { value: 'logistica', label: 'Logística', icon: '🚚', description: 'Transporte, Entregas' },
  { value: 'financeiro', label: 'Financeiro', icon: '💰', description: 'Bancos, Contabilidade' },
  { value: 'juridico', label: 'Jurídico', icon: '⚖️', description: 'Advocacia, Consultoria' },
  { value: 'marketing', label: 'Marketing', icon: '📢', description: 'Publicidade, Design' },
  { value: 'imobiliario', label: 'Imobiliário', icon: '🏠', description: 'Imóveis, Corretagem' },
  { value: 'agronegocio', label: 'Agronegócio', icon: '🌾', description: 'Agricultura, Pecuária' },
  { value: 'beleza', label: 'Beleza', icon: '💇', description: 'Salões, Estética' },
  { value: 'automotivo', label: 'Automotivo', icon: '🚗', description: 'Oficinas, Concessionárias' },
  { value: 'turismo', label: 'Turismo', icon: '✈️', description: 'Viagens, Hotelaria' },
  { value: 'energia', label: 'Energia', icon: '⚡', description: 'Elétrica, Solar, Renovável' },
  { value: 'textil', label: 'Têxtil', icon: '🧵', description: 'Confecção, Moda' },
  { value: 'outros', label: 'Outros', icon: '📦', description: 'Outras categorias' },
] as const;

export const COMPANY_SIZES = [
  { value: 'mei', label: 'MEI', description: 'Microempreendedor Individual' },
  { value: 'micro', label: 'Microempresa', description: 'Até 9 funcionários' },
  { value: 'pequena', label: 'Pequena', description: '10 a 49 funcionários' },
  { value: 'media', label: 'Média', description: '50 a 99 funcionários' },
  { value: 'grande', label: 'Grande', description: '100+ funcionários' },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Tempo Integral', icon: '⏰' },
  { value: 'part_time', label: 'Meio Período', icon: '⌛' },
  { value: 'temporary', label: 'Temporário', icon: '📅' },
  { value: 'internship', label: 'Estágio', icon: '🎓' },
  { value: 'freelance', label: 'Freelancer', icon: '💼' },
  { value: 'trainee', label: 'Trainee', icon: '🌟' },
] as const;

export const WORK_MODES = [
  { value: 'presential', label: 'Presencial', icon: '🏢' },
  { value: 'remote', label: 'Remoto', icon: '🏠' },
  { value: 'hybrid', label: 'Híbrido', icon: '🔄' },
] as const;

export const APPLICATION_STATUS = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-500' },
  { value: 'reviewed', label: 'Visualizado', color: 'bg-blue-500' },
  { value: 'shortlisted', label: 'Pré-selecionado', color: 'bg-purple-500' },
  { value: 'rejected', label: 'Não selecionado', color: 'bg-red-500' },
  { value: 'hired', label: 'Contratado', color: 'bg-green-500' },
] as const;

export function getCategoryLabel(value: string): string {
  const category = COMPANY_CATEGORIES.find(c => c.value === value);
  return category?.label || value;
}

export function getCategoryIcon(value: string): string {
  const category = COMPANY_CATEGORIES.find(c => c.value === value);
  return category?.icon || '📦';
}

export function getEmploymentTypeLabel(value: string): string {
  const type = EMPLOYMENT_TYPES.find(t => t.value === value);
  return type?.label || value;
}

export function getWorkModeLabel(value: string): string {
  const mode = WORK_MODES.find(m => m.value === value);
  return mode?.label || value;
}

export function getApplicationStatusLabel(value: string): string {
  const status = APPLICATION_STATUS.find(s => s.value === value);
  return status?.label || value;
}

export function getApplicationStatusColor(value: string): string {
  const status = APPLICATION_STATUS.find(s => s.value === value);
  return status?.color || 'bg-gray-500';
}

export function getCompanySizeLabel(value: string): string {
  const size = COMPANY_SIZES.find(s => s.value === value);
  return size?.label || value;
}
