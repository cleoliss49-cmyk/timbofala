
-- Create business profiles table
CREATE TABLE public.business_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Timbó',
  neighborhood TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  opening_hours JSONB,
  offers_delivery BOOLEAN NOT NULL DEFAULT false,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business products table
CREATE TABLE public.business_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  promotional_price NUMERIC(10,2),
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  stock_quantity INTEGER,
  is_available BOOLEAN NOT NULL DEFAULT true,
  allows_delivery BOOLEAN NOT NULL DEFAULT true,
  weight TEXT,
  dimensions TEXT,
  sku TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business product images table for multiple images
CREATE TABLE public.business_product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.business_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business categories table
CREATE TABLE public.business_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart items table for visitors
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.business_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  wants_delivery BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE public.business_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  wants_delivery BOOLEAN NOT NULL DEFAULT false,
  delivery_address TEXT,
  customer_phone TEXT,
  customer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.business_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.business_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.business_products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_profiles
CREATE POLICY "Business profiles are viewable by everyone"
ON public.business_profiles FOR SELECT
USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own business profile"
ON public.business_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profile"
ON public.business_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business profile"
ON public.business_profiles FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for business_products
CREATE POLICY "Products are viewable by everyone"
ON public.business_products FOR SELECT
USING (true);

CREATE POLICY "Business owners can create products"
ON public.business_products FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.business_profiles
  WHERE id = business_id AND user_id = auth.uid()
));

CREATE POLICY "Business owners can update their products"
ON public.business_products FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.business_profiles
  WHERE id = business_id AND user_id = auth.uid()
));

CREATE POLICY "Business owners can delete their products"
ON public.business_products FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.business_profiles
  WHERE id = business_id AND user_id = auth.uid()
));

-- RLS Policies for product images
CREATE POLICY "Product images are viewable by everyone"
ON public.business_product_images FOR SELECT
USING (true);

CREATE POLICY "Business owners can manage product images"
ON public.business_product_images FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.business_products bp
  JOIN public.business_profiles bpr ON bp.business_id = bpr.id
  WHERE bp.id = product_id AND bpr.user_id = auth.uid()
));

CREATE POLICY "Business owners can delete product images"
ON public.business_product_images FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.business_products bp
  JOIN public.business_profiles bpr ON bp.business_id = bpr.id
  WHERE bp.id = product_id AND bpr.user_id = auth.uid()
));

-- RLS Policies for categories
CREATE POLICY "Categories are viewable by everyone"
ON public.business_categories FOR SELECT
USING (true);

-- RLS Policies for cart_items
CREATE POLICY "Users can view their own cart"
ON public.cart_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their cart"
ON public.cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their cart"
ON public.cart_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from their cart"
ON public.cart_items FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view their orders"
ON public.business_orders FOR SELECT
USING (customer_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.business_profiles
  WHERE id = business_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create orders"
ON public.business_orders FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Business owners can update order status"
ON public.business_orders FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.business_profiles
  WHERE id = business_id AND user_id = auth.uid()
));

-- RLS Policies for order items
CREATE POLICY "Order items are viewable by order participants"
ON public.business_order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.business_orders bo
  WHERE bo.id = order_id AND (
    bo.customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.business_profiles bp
      WHERE bp.id = bo.business_id AND bp.user_id = auth.uid()
    )
  )
));

CREATE POLICY "System can insert order items"
ON public.business_order_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.business_orders bo
  WHERE bo.id = order_id AND bo.customer_id = auth.uid()
));

-- Create storage bucket for business assets
INSERT INTO storage.buckets (id, name, public) VALUES ('business', 'business', true);

-- Storage policies
CREATE POLICY "Business images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'business');

CREATE POLICY "Users can upload business images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their business images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'business' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their business images"
ON storage.objects FOR DELETE
USING (bucket_id = 'business' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert default categories
INSERT INTO public.business_categories (name, icon, sort_order) VALUES
('Alimentação', 'utensils', 1),
('Moda e Vestuário', 'shirt', 2),
('Eletrônicos', 'smartphone', 3),
('Casa e Decoração', 'home', 4),
('Beleza e Cosméticos', 'sparkles', 5),
('Esportes e Lazer', 'dumbbell', 6),
('Automotivo', 'car', 7),
('Serviços', 'wrench', 8),
('Outros', 'package', 9);

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'TF' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for order number
CREATE TRIGGER set_order_number
BEFORE INSERT ON public.business_orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_number();

-- Function to check if user has business profile
CREATE OR REPLACE FUNCTION public.has_business_profile(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE user_id = _user_id AND is_active = true
  )
$$;

-- Trigger for updated_at
CREATE TRIGGER update_business_profiles_updated_at
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_business_products_updated_at
BEFORE UPDATE ON public.business_products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_business_orders_updated_at
BEFORE UPDATE ON public.business_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
