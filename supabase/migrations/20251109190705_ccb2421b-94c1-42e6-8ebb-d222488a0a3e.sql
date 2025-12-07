-- Add version tracking to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_document_id uuid REFERENCES public.documents(id),
ADD COLUMN IF NOT EXISTS rejected_reason text,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Update RLS policies for document approval
CREATE POLICY "Admins can approve documents"
ON public.documents
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster version lookups
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON public.documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_load_id ON public.documents(load_id);