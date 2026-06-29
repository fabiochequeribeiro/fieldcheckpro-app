begin;

alter table public.modelos_checklist_genericos
  add column if not exists tag text;

create index if not exists modelos_checklist_genericos_empresa_tag_idx
  on public.modelos_checklist_genericos (lower(empresa), lower(tag))
  where tag is not null and trim(tag) <> '';

update public.modelos_checklist_genericos
set tag = upper(regexp_replace(coalesce(tag, ''), '\s+', '', 'g'))
where tag is not null;

commit;
