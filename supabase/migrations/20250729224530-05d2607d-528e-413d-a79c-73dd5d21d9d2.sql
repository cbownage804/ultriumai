-- Fix Function Search Path Security Issues
-- Add SET search_path to functions that are missing it

-- Fix halfvec_accum function
DROP FUNCTION IF EXISTS public.halfvec_accum(double precision[], halfvec);
CREATE OR REPLACE FUNCTION public.halfvec_accum(double precision[], halfvec)
 RETURNS double precision[]
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO 'public'
AS '$libdir/vector', $function$halfvec_accum$function$;

-- Fix halfvec_avg function  
DROP FUNCTION IF EXISTS public.halfvec_avg(double precision[]);
CREATE OR REPLACE FUNCTION public.halfvec_avg(double precision[])
 RETURNS halfvec
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO 'public'
AS '$libdir/vector', $function$halfvec_avg$function$;

-- Fix halfvec_combine function
DROP FUNCTION IF EXISTS public.halfvec_combine(double precision[], double precision[]);
CREATE OR REPLACE FUNCTION public.halfvec_combine(double precision[], double precision[])
 RETURNS double precision[]
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO 'public'
AS '$libdir/vector', $function$vector_combine$function$;

-- Fix vector_accum function
DROP FUNCTION IF EXISTS public.vector_accum(double precision[], vector);
CREATE OR REPLACE FUNCTION public.vector_accum(double precision[], vector)
 RETURNS double precision[]
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO 'public'
AS '$libdir/vector', $function$vector_accum$function$;

-- Fix vector_avg function
DROP FUNCTION IF EXISTS public.vector_avg(double precision[]);
CREATE OR REPLACE FUNCTION public.vector_avg(double precision[])
 RETURNS vector
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO 'public'
AS '$libdir/vector', $function$vector_avg$function$;

-- Fix vector_combine function
DROP FUNCTION IF EXISTS public.vector_combine(double precision[], double precision[]);
CREATE OR REPLACE FUNCTION public.vector_combine(double precision[], double precision[])
 RETURNS double precision[]
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO 'public'
AS '$libdir/vector', $function$vector_combine$function$;