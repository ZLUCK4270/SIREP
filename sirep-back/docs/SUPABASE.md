# SIREP: conectar el backend a un proyecto de Supabase en la nube

Este documento lista qué datos hacen falta del proyecto de Supabase, dónde se encuentra cada uno y cómo se aplica la base de datos sin configurar nada a mano en el panel. El documento del Día 1 lo pide así porque las cuentas son temporales y luego se migran a las oficiales.

---

## 1. Qué se necesita del proyecto

| # | Dato | Para qué sirve | Dónde se encuentra en el panel |
|---|---|---|---|
| 1 | **Project URL** | `SUPABASE_URL` en `.env`: el backend se conecta a esta dirección | *Project Settings → Data API* (o el botón **Connect**). Formato: `https://<ref>.supabase.co` |
| 2 | **Clave secreta / service_role** | `SUPABASE_KEY` en `.env`: el backend la usa para leer y escribir en la base y en Storage | *Project Settings → API Keys*. Sirve la **secret key** (`sb_secret_...`) o la **service_role** de la pestaña *Legacy API keys* |
| 3 | **Project ref** | Vincular el repositorio al proyecto con Supabase CLI | Es el identificador de la URL: `https://<ref>.supabase.co`. También en *Project Settings → General* |
| 4 | **Contraseña de la base de datos** | Que la CLI pueda aplicar las migraciones | La que se definió al crear el proyecto. Si no la recuerdas: *Project Settings → Database → Reset database password* |
| 5 | **Access token personal** | Iniciar sesión en Supabase CLI (`supabase login`) | https://supabase.com/dashboard/account/tokens → *Generate new token* |

> [!CAUTION]
> La clave secreta (dato 2) **salta todas las reglas de seguridad (RLS)** y da acceso total a la base. Solo va en el `.env` del backend: nunca en el frontend, nunca en el repositorio y nunca en un chat. Lo más seguro es que la pegues tú mismo en el `.env`.

> [!NOTE]
> Si con la clave nueva `sb_secret_...` el backend da error de autenticación, usa la **service_role** de *Legacy API keys*. El proyecto usa `@supabase/supabase-js` 2.45 y es posible que esa versión no acepte las claves nuevas; no está probado.

---

## 2. Completar el `.env`

```bash
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_KEY=<clave secreta o service_role>
```

Los datos 3, 4 y 5 **no van en el `.env`**: solo se usan en los comandos de la CLI de la sección siguiente.

---

## 3. Aplicar la base de datos con migraciones (sin tocar el panel)

Se necesita Node.js; la CLI se ejecuta con `npx`, así que no hay que instalarla.

```bash
# 1. Iniciar sesión en la CLI (pide el access token, dato 5)
npx supabase login

# 2. Crear supabase/config.toml (solo la primera vez)
npx supabase init

# 3. Vincular el repositorio al proyecto (pide la contraseña de la base, dato 4)
npx supabase link --project-ref <ref>

# 4. Aplicar las migraciones de supabase/migrations/
npx supabase db push
```

`db push` crea las tablas `escaneos` y `reportes` y el bucket privado `escaneos-originales`, a partir de [20261102000000_sirep_inicial.sql](../supabase/migrations/20261102000000_sirep_inicial.sql).

> [!WARNING]
> **No ejecutes `supabase db reset --linked` contra la nube**: borra **todos** los datos del proyecto remoto. El criterio "`supabase db reset` reconstruye la base completa" del Día 1 se comprueba en local (`npx supabase start` + `npx supabase db reset`), y eso requiere Docker Desktop.

---

## 4. Comprobar que quedó bien

En el panel (solo para mirar, sin cambiar nada):

- *Table Editor*: aparecen las tablas `escaneos` y `reportes`.
- *Storage*: aparece el bucket `escaneos-originales`, marcado como privado.
- *Database → Migrations*: aparece `20261102000000_sirep_inicial`.

Desde el backend:

```bash
npm run start:dev
# Debe arrancar sin el error "Faltan SUPABASE_URL o SUPABASE_KEY"
# http://localhost:3000/health  -> responde OK
# http://localhost:3000/escaneos -> devuelve []
```

---

## 5. Pendientes que afectan a la base

- **Tabla `reportes`:** la que está hoy en la migración es **provisional**. El documento del Día 1 dice que se copie de las migraciones de RP-TECH, con los cambios que acuerden Miguel y Adrián. Cuando eso esté acordado, se reemplaza con una **migración nueva**; la que ya se aplicó no se edita.
- **Tabla de revisión de campos:** se define después de la prueba de viabilidad.
- Cuando el proyecto pase a las cuentas oficiales, se repiten las secciones 2 y 3 con los datos del proyecto nuevo.

