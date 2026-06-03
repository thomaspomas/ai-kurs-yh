-- Rensa databasen från alla inloggningar och tillhörande användardata.
-- Kör detta i Supabase SQL Editor med administratörsåtkomst (service role eller projektägare).

begin;

-- Ta bort all användardata i appens publika tabeller.
delete from public.diplomas;
delete from public.exam_submissions;
delete from public.reflections;
delete from public.module_progress;
delete from public.profiles;

-- Ta bort alla autentiserade användare.
-- Detta kommer att kaskadreagera bort relaterade profiler och sessioner.
delete from auth.users;

commit;
