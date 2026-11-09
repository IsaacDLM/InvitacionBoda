create extension if not exists unaccent with schema extensions;

create or replace function public.normalize_guest_name(p_name text)
returns text
language sql
stable
strict
set search_path = ''
as $$
  select regexp_replace(
    lower(extensions.unaccent(btrim(p_name))),
    '\s+',
    ' ',
    'g'
  );
$$;

create table public.invited_guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  normalized_name text not null unique,
  registered_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invited_guests_name_not_blank check (btrim(full_name) <> ''),
  constraint invited_guests_normalized_name_not_blank check (normalized_name <> '')
);

create table public.rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  primary_guest_id uuid not null references public.invited_guests(id),
  attending boolean not null,
  allergies text not null default '',
  message text not null default '',
  submitted_at timestamptz not null default now()
);

create table public.guest_menu_reservations (
  guest_id uuid primary key references public.invited_guests(id),
  rsvp_id uuid not null references public.rsvp_responses(id),
  menu_option text not null check (
    menu_option in ('Paella valenciana', 'Arroz del señoret', 'Fidegua de marisco')
  ),
  created_at timestamptz not null default now()
);

create table public.guest_rsvp_rate_limit (
  fingerprint text not null,
  created_at timestamptz not null default now()
);

create index guest_rsvp_rate_limit_fingerprint_created_at_idx
  on public.guest_rsvp_rate_limit (fingerprint, created_at desc);

alter table public.invited_guests enable row level security;
alter table public.rsvp_responses enable row level security;
alter table public.guest_menu_reservations enable row level security;
alter table public.guest_rsvp_rate_limit enable row level security;

revoke all on public.invited_guests from anon, authenticated;
revoke all on public.rsvp_responses from anon, authenticated;
revoke all on public.guest_menu_reservations from anon, authenticated;
revoke all on public.guest_rsvp_rate_limit from anon, authenticated;

create or replace function public.check_invited_guest(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registered_at timestamptz;
begin
  if p_name is null or length(btrim(p_name)) < 3 or length(p_name) > 120 then
    return 'not_found';
  end if;

  select registered_at
    into v_registered_at
    from public.invited_guests
    where normalized_name = public.normalize_guest_name(p_name);

  if not found then
    return 'not_found';
  end if;

  if v_registered_at is not null then
    return 'registered';
  end if;

  return 'available';
end;
$$;

create or replace function public.consume_guest_rsvp_request(p_fingerprint text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer;
begin
  if p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_fingerprint)::bigint);
  delete from public.guest_rsvp_rate_limit
    where created_at < now() - interval '24 hours';

  select count(*)
    into v_attempts
    from public.guest_rsvp_rate_limit
    where fingerprint = p_fingerprint
      and created_at > now() - interval '10 minutes';

  if v_attempts >= 60 then
    return false;
  end if;

  insert into public.guest_rsvp_rate_limit (fingerprint) values (p_fingerprint);
  return true;
end;
$$;

create or replace function public.submit_guest_rsvp(p_response jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attending boolean;
  v_attendees jsonb;
  v_attendee jsonb;
  v_name text;
  v_name_key text;
  v_primary_name_key text;
  v_guest_id uuid;
  v_primary_guest_id uuid;
  v_registered_at timestamptz;
  v_rsvp_id uuid;
  v_keys text[] := array[]::text[];
  v_count integer;
begin
  if jsonb_typeof(p_response) is distinct from 'object'
     or p_response->>'asistencia' is null
     or p_response->>'asistencia' not in ('Sí', 'No')
     or length(coalesce(p_response->>'nombre', '')) < 3
     or length(coalesce(p_response->>'nombre', '')) > 120
     or length(coalesce(p_response->>'alergias', '')) > 1000
     or length(coalesce(p_response->>'mensaje', '')) > 2000 then
    return jsonb_build_object('status', 'invalid');
  end if;

  v_attending := p_response->>'asistencia' = 'Sí';
  v_primary_name_key := public.normalize_guest_name(p_response->>'nombre');
  v_attendees := p_response->'invitados';

  if v_attending then
    if jsonb_typeof(v_attendees) is distinct from 'array' then
      return jsonb_build_object('status', 'invalid');
    end if;

    v_count := case
      when p_response->>'acompanantes' ~ '^[1-5]$'
        then (p_response->>'acompanantes')::integer
      else 0
    end;

    if jsonb_array_length(v_attendees) < 1
       or jsonb_array_length(v_attendees) > 5
       or v_count <> jsonb_array_length(v_attendees) then
      return jsonb_build_object('status', 'invalid');
    end if;

    for v_attendee in select value from jsonb_array_elements(v_attendees)
    loop
      v_name := btrim(coalesce(v_attendee->>'nombre', ''));
      if length(v_name) < 3
         or length(v_name) > 120
         or coalesce(v_attendee->>'menu', '') not in ('1', '2', '3') then
        return jsonb_build_object('status', 'invalid');
      end if;

      v_name_key := public.normalize_guest_name(v_name);
      if v_name_key = any(v_keys) then
        return jsonb_build_object('status', 'duplicate', 'nombre', v_name);
      end if;
      v_keys := array_append(v_keys, v_name_key);
    end loop;

    if v_keys[1] <> v_primary_name_key then
      return jsonb_build_object('status', 'invalid');
    end if;
  else
    v_keys := array[v_primary_name_key];
  end if;

  perform id
    from public.invited_guests
    where normalized_name = any(v_keys)
    order by normalized_name
    for update;

  for v_attendee in
    select value from jsonb_array_elements(
      case when v_attending then v_attendees
           else jsonb_build_array(jsonb_build_object('nombre', p_response->>'nombre'))
      end
    )
  loop
    v_name := btrim(v_attendee->>'nombre');
    v_name_key := public.normalize_guest_name(v_name);
    select id, registered_at
      into v_guest_id, v_registered_at
      from public.invited_guests
      where normalized_name = v_name_key;

    if not found then
      return jsonb_build_object('status', 'not_found', 'nombre', v_name);
    end if;

    if v_registered_at is not null then
      return jsonb_build_object('status', 'registered', 'nombre', v_name);
    end if;

    if v_name_key = v_primary_name_key then
      v_primary_guest_id := v_guest_id;
    end if;
  end loop;

  insert into public.rsvp_responses (
    primary_guest_id,
    attending,
    allergies,
    message
  ) values (
    v_primary_guest_id,
    v_attending,
    coalesce(p_response->>'alergias', ''),
    coalesce(p_response->>'mensaje', '')
  )
  returning id into v_rsvp_id;

  if v_attending then
    for v_attendee in select value from jsonb_array_elements(v_attendees)
    loop
      v_name_key := public.normalize_guest_name(v_attendee->>'nombre');
      select id into v_guest_id
        from public.invited_guests
        where normalized_name = v_name_key;

      insert into public.guest_menu_reservations (guest_id, rsvp_id, menu_option)
      values (
        v_guest_id,
        v_rsvp_id,
        case v_attendee->>'menu'
          when '1' then 'Paella valenciana'
          when '2' then 'Arroz del señoret'
          when '3' then 'Fidegua de marisco'
        end
      );

      update public.invited_guests
        set registered_at = now()
        where id = v_guest_id;
    end loop;
  end if;

  return jsonb_build_object('status', 'ok');
end;
$$;

revoke all on function public.check_invited_guest(text) from public, anon, authenticated;
revoke all on function public.consume_guest_rsvp_request(text) from public, anon, authenticated;
revoke all on function public.submit_guest_rsvp(jsonb) from public, anon, authenticated;
grant execute on function public.check_invited_guest(text) to service_role;
grant execute on function public.consume_guest_rsvp_request(text) to service_role;
grant execute on function public.submit_guest_rsvp(jsonb) to service_role;
