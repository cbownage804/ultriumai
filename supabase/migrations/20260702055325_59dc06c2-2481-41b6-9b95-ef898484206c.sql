
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrayth_devices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrayth_device_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrayth_device_posture TO authenticated;
GRANT SELECT ON public.wrayth_device_posture_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrayth_device_enrollments TO authenticated;

GRANT ALL ON public.wrayth_devices TO service_role;
GRANT ALL ON public.wrayth_device_actions TO service_role;
GRANT ALL ON public.wrayth_device_posture TO service_role;
GRANT ALL ON public.wrayth_device_posture_history TO service_role;
GRANT ALL ON public.wrayth_device_enrollments TO service_role;
