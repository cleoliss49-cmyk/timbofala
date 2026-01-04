
-- =============================================
-- SISTEMA DE EMPRESAS (SEPARADO DE COMÉRCIOS)
-- =============================================

-- Tabela principal de empresas
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  
  -- Categoria principal
  category TEXT NOT NULL DEFAULT 'outros',
  subcategory TEXT,
  
  -- Contato
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  linkedin TEXT,
  
  -- Localização
  city TEXT NOT NULL DEFAULT 'Timbó',
  neighborhood TEXT,
  address TEXT,
  
  -- Configurações
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para empresas
CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_companies_category ON public.companies(category);
CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_companies_city ON public.companies(city);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies para empresas
CREATE POLICY "Companies are viewable by everyone"
ON public.companies FOR SELECT
USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own company"
ON public.companies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company"
ON public.companies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company"
ON public.companies FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- SISTEMA DE VAGAS DE EMPREGO
-- =============================================

-- Tabela de vagas
CREATE TABLE public.job_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Informações da vaga
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  benefits TEXT,
  
  -- Tipo e modalidade
  employment_type TEXT NOT NULL DEFAULT 'full_time', -- full_time, part_time, contract, internship, freelance
  work_mode TEXT NOT NULL DEFAULT 'onsite', -- onsite, remote, hybrid
  
  -- Salário (opcional)
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_type TEXT DEFAULT 'monthly', -- monthly, hourly, yearly
  hide_salary BOOLEAN DEFAULT false,
  
  -- Localização
  city TEXT NOT NULL DEFAULT 'Timbó',
  neighborhood TEXT,
  
  -- Status e controle
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  applications_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para vagas
CREATE INDEX idx_job_listings_company_id ON public.job_listings(company_id);
CREATE INDEX idx_job_listings_is_active ON public.job_listings(is_active);
CREATE INDEX idx_job_listings_employment_type ON public.job_listings(employment_type);
CREATE INDEX idx_job_listings_city ON public.job_listings(city);

-- Enable RLS
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies para vagas
CREATE POLICY "Active job listings are viewable by everyone"
ON public.job_listings FOR SELECT
USING (
  is_active = true 
  OR EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = job_listings.company_id 
    AND companies.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can create job listings"
ON public.job_listings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = job_listings.company_id 
    AND companies.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can update their job listings"
ON public.job_listings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = job_listings.company_id 
    AND companies.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can delete their job listings"
ON public.job_listings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = job_listings.company_id 
    AND companies.user_id = auth.uid()
  )
);

-- =============================================
-- CANDIDATURAS COM UPLOAD DE CURRÍCULO PDF
-- =============================================

-- Tabela de candidaturas
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Dados do candidato
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Currículo
  resume_url TEXT NOT NULL, -- URL do PDF no storage
  cover_letter TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, shortlisted, rejected, hired
  notes TEXT, -- Notas internas da empresa
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Evitar candidaturas duplicadas
  UNIQUE(job_id, user_id)
);

-- Índices para candidaturas
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies para candidaturas
CREATE POLICY "Users can view their own applications"
ON public.job_applications FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.job_listings jl
    JOIN public.companies c ON c.id = jl.company_id
    WHERE jl.id = job_applications.job_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create applications"
ON public.job_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
ON public.job_applications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Company owners can update application status"
ON public.job_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.job_listings jl
    JOIN public.companies c ON c.id = jl.company_id
    WHERE jl.id = job_applications.job_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own applications"
ON public.job_applications FOR DELETE
USING (user_id = auth.uid());

-- =============================================
-- PORTFÓLIO DE EMPRESAS (para serviços, tecnologia, etc.)
-- =============================================

CREATE TABLE public.company_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  project_url TEXT,
  
  -- Categorização
  category TEXT,
  tags TEXT[],
  
  -- Ordem de exibição
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice
CREATE INDEX idx_company_portfolio_company_id ON public.company_portfolio(company_id);

-- Enable RLS
ALTER TABLE public.company_portfolio ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Portfolio items are viewable by everyone"
ON public.company_portfolio FOR SELECT
USING (true);

CREATE POLICY "Company owners can manage their portfolio"
ON public.company_portfolio FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_portfolio.company_id 
    AND companies.user_id = auth.uid()
  )
);

-- =============================================
-- SERVIÇOS OFERECIDOS PELA EMPRESA
-- =============================================

CREATE TABLE public.company_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  price_type TEXT DEFAULT 'fixed', -- fixed, hourly, quote
  
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice
CREATE INDEX idx_company_services_company_id ON public.company_services(company_id);

-- Enable RLS
ALTER TABLE public.company_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Services are viewable by everyone"
ON public.company_services FOR SELECT
USING (true);

CREATE POLICY "Company owners can manage their services"
ON public.company_services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_services.company_id 
    AND companies.user_id = auth.uid()
  )
);

-- =============================================
-- GALERIA DE IMAGENS DA EMPRESA
-- =============================================

CREATE TABLE public.company_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice
CREATE INDEX idx_company_gallery_company_id ON public.company_gallery(company_id);

-- Enable RLS
ALTER TABLE public.company_gallery ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Gallery is viewable by everyone"
ON public.company_gallery FOR SELECT
USING (true);

CREATE POLICY "Company owners can manage their gallery"
ON public.company_gallery FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_gallery.company_id 
    AND companies.user_id = auth.uid()
  )
);

-- =============================================
-- TRIGGER PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_job_listings_updated_at
BEFORE UPDATE ON public.job_listings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_company_services_updated_at
BEFORE UPDATE ON public.company_services
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- TRIGGER PARA CONTAR CANDIDATURAS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_listings 
    SET applications_count = applications_count + 1 
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_listings 
    SET applications_count = applications_count - 1 
    WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_applications_count
AFTER INSERT OR DELETE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_job_applications_count();

-- =============================================
-- STORAGE BUCKET PARA CURRÍCULOS
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para currículos
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Company owners can view resumes of their job applications"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes'
  AND EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.job_listings jl ON jl.id = ja.job_id
    JOIN public.companies c ON c.id = jl.company_id
    WHERE ja.resume_url LIKE '%' || name
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- STORAGE BUCKET PARA ARQUIVOS DE EMPRESAS
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('companies', 'companies', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para empresas
CREATE POLICY "Anyone can view company files"
ON storage.objects FOR SELECT
USING (bucket_id = 'companies');

CREATE POLICY "Authenticated users can upload company files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'companies' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their company files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'companies' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their company files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'companies' 
  AND auth.role() = 'authenticated'
);
