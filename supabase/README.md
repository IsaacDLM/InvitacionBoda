# Configuración de invitados en Supabase

La lista de invitados se almacena en `invited_guests`. El navegador solo llama a la función `guest-rsvp`; las tablas no son accesibles desde claves públicas. La función usa la clave `service_role` únicamente en el servidor y reserva los nombres y menús dentro de una única transacción de base de datos.

## Preparación

1. Crea un proyecto de Supabase y aplica la migración desde el SQL Editor o con `supabase db push`.
2. Carga la lista autorizada en `public.invited_guests`. Los nombres normalizados deben ser únicos:

   ```sql
   insert into public.invited_guests (full_name, normalized_name)
   values ('Nombre Apellido', public.normalize_guest_name('Nombre Apellido'));
   ```

3. Despliega la función `guest-rsvp` con `supabase functions deploy guest-rsvp`.
4. Configura los secretos de la función en Supabase:
   - `SUPABASE_SERVICE_ROLE_KEY`: clave secreta `service_role`; nunca la incluyas en la web.
   - `INVITATION_ORIGIN`: origen exacto de la web, por ejemplo `https://tudominio.es`.
   - `RATE_LIMIT_SECRET`: secreto aleatorio largo para crear huellas HMAC de las IP, sin guardar las IP originales.
5. En `script/script.js`, completa `CONFIG.supabaseUrl` y `CONFIG.supabaseAnonKey` con la URL del proyecto y su clave pública `anon`/publishable. La clave pública no concede acceso directo a la lista.

La tabla de invitados comienza vacía: hasta cargar la lista y configurar Supabase en la web, la validación falla de forma cerrada y no se habilitan los menús.

Los nombres se comparan ignorando mayúsculas, tildes y espacios repetidos. No se deben cargar dos invitados con el mismo nombre normalizado: sin un código privado no hay forma segura de distinguirlos.

La función limita a 60 solicitudes por IP cada 10 minutos y no devuelve la lista de invitados. Los menús se guardan como nombre legible en `guest_menu_reservations`. Aun así, validar solo por nombre no acredita la identidad: alguien que conozca un nombre puede intentar confirmar por esa persona, y la respuesta «no encontrado» permite inferir si un nombre pertenece a la lista. Para impedir suplantaciones se necesitaría un código privado por invitación o una verificación de identidad adicional.
