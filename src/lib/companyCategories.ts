export const COMPANY_CATEGORIES = [
  { value: 'industria', label: 'Indústria', icon: '🏭', description: 'Metalúrgicas, fábricas, confecções' },
  { value: 'servicos', label: 'Serviços', icon: '💼', description: 'Contabilidade, advocacia, consultoria' },
  { value: 'tecnologia', label: 'Tecnologia', icon: '💻', description: 'Desenvolvimento, TI, startups' },
  { value: 'construcao', label: 'Construção', icon: '🏗️', description: 'Construtoras, engenharia, arquitetura' },
  { value: 'beleza', label: 'Beleza', icon: '💅', description: 'Salões, estética, cosméticos' },
  { value: 'saude', label: 'Saúde', icon: '🏥', description: 'Clínicas, laboratórios, farmácias' },
  { value: 'alimentos', label: 'Alimentos', icon: '🍽️', description: 'Restaurantes, padarias, distribuidoras' },
  { value: 'educacao', label: 'Educação', icon: '📚', description: 'Escolas, cursos, treinamentos' },
  { value: 'logistica', label: 'Logística', icon: '🚚', description: 'Transportes, armazenagem, entregas' },
  { value: 'agronegocio', label: 'Agronegócio', icon: '🌾', description: 'Agricultura, pecuária, insumos' },
  { value: 'outros', label: 'Outros', icon: '🏢', description: 'Outras categorias' },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Tempo Integral' },
  { value: 'part_time', label: 'Meio Período' },
  { value: 'contract', label: 'Contrato' },
  { value: 'internship', label: 'Estágio' },
  { value: 'freelance', label: 'Freelancer' },
] as const;

export const WORK_MODES = [
  { value: 'onsite', label: 'Presencial' },
  { value: 'remote', label: 'Remoto' },
  { value: 'hybrid', label: 'Híbrido' },
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
  return category?.icon || '🏢';
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
