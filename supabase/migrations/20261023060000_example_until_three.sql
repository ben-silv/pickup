-- Keep the example project in the Browse feed until there are 3 real published projects (was: the first one).

create or replace view public.open_roles with (security_invoker = true) as
select r.id          as role_id,
       r.category,
       r.need,
       r.hours,
       r.created_at,
       p.id          as project_id,
       p.title,
       p.pitch,
       p.stage,
       pr.id         as owner_id,
       pr.full_name  as owner_name,
       pr.class_year as owner_class_year,
       pr.major      as owner_major,
       p.is_example
from public.roles r
join public.projects p  on p.id = r.project_id
join public.profiles pr on pr.id = p.owner_id
where r.status = 'open' and p.status = 'published'
  and (not p.is_example
       or (select count(*) from public.projects real where real.status = 'published' and not real.is_example) < 3);
