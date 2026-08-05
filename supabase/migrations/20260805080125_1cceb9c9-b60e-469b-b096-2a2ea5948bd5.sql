
REVOKE ALL ON FUNCTION public.join_tournament(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_withdrawal(integer, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_room_credentials(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_tournament(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_room_credentials(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
