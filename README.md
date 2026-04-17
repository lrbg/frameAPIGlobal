# QA API Framework

> Framework de automatización de pruebas para APIs REST, construido con **Bruno + Node.js + React**.
> Incluye dashboard interactivo, documentación Swagger auto-generada e integración con GitHub Actions.

**Live Dashboard →** https://lrbg.github.io/frameAPIGlobal/
**Repositorio →** https://github.com/lrbg/frameAPIGlobal

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso Local — Modo Completo](#uso-local--modo-completo)
  - [Iniciar el Backend](#1-iniciar-el-backend)
  - [Iniciar el Frontend](#2-iniciar-el-frontend)
  - [Ejecutar Tests con Bruno CLI](#3-ejecutar-tests-con-bruno-cli)
  - [API del Backend](#4-api-del-backend)
  - [Generar Swagger estático](#5-generar-swagger-estático)
- [Endpoints Cubiertos y Tests](#endpoints-cubiertos-y-tests)
- [Estructura de un Archivo Bruno (.bru)](#estructura-de-un-archivo-bruno-bru)
- [Dashboard — Guía de Uso](#dashboard--guía-de-uso)
- [GitHub Actions — CI/CD](#github-actions--cicd)
- [GitHub Pages — Despliegue Público](#github-pages--despliegue-público)
- [Agregar Nuevos Endpoints](#agregar-nuevos-endpoints)
- [Estructura Completa del Proyecto](#estructura-completa-del-proyecto)
- [Solución de Problemas](#solución-de-problemas)

---

## Descripción General

Este framework permite:

- **Definir pruebas de API** en archivos `.bru` (formato Bruno), agrupados por recurso
- **Ejecutar las pruebas** desde la línea de comandos, desde la interfaz web o automáticamente en cada push
- **Ver reportes** de ejecución con estadísticas de paso/fallo, tiempos de respuesta e historial de runs
- **Consultar la documentación** de los endpoints en formato Swagger UI, generada automáticamente desde las colecciones Bruno
- **Integrarse con CI/CD** a través de GitHub Actions, actualizando los datos del dashboard en cada ejecución

Se usa la [PokéAPI](https://pokeapi.co/api/v2/) como API de ejemplo, una API pública REST sin autenticación.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Colecciones de prueba | [Bruno](https://www.usebruno.com/) CLI | `@usebruno/cli` |
| Servidor / Runner | Node.js + Express | Node 20+ |
| Dashboard | React + Vite + Tailwind CSS | React 18 |
| Documentación | Swagger UI React (OpenAPI 3.0) | v5 |
| Gráficas | Recharts | v2 |
| CI/CD | GitHub Actions | — |
| Hosting estático | GitHub Pages | — |

---

## Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Actions                         │
│  push/PR → run-tests.yml → bru run → guarda JSON + Swagger  │
│  push/main → deploy.yml  → npm build → GitHub Pages         │
└─────────────────┬───────────────────────────────────────────┘
                  │ commit data files
                  ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│   collections/pokeapi/      │   │   frontend/public/data/     │
│   *.bru  (Bruno tests)      │──▶│   swagger.json              │
│                             │   │   latest.json               │
│   pokemon/ berry/ item/     │   │   history.json              │
│   move/ type/ ability/      │   └──────────────┬──────────────┘
└─────────────────────────────┘                  │ fetch
                                                  ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│   backend/ (Express)        │   │   frontend/ (React + Vite)  │
│   POST /api/run-tests       │◀──│   Dashboard    (charts)     │
│   GET  /api/results         │──▶│   TestRunner   (ejecutar)   │
│   GET  /api/swagger         │   │   Results      (historial)  │
│   GET  /api/collections     │   │   Documentation (Swagger)   │
└─────────────────────────────┘   └─────────────────────────────┘
        (solo modo local)                (GitHub Pages: estático)
```

**Modo local:** el frontend React se conecta al backend Express para ejecutar tests en tiempo real.
**Modo GitHub Pages:** el frontend lee archivos JSON estáticos generados por GitHub Actions.

---

## Requisitos Previos

Asegúrate de tener instalados:

| Herramienta | Versión mínima | Verificar |
|-------------|---------------|-----------|
| Node.js | 18.x o superior | `node --version` |
| npm | 9.x o superior | `npm --version` |
| Git | cualquier versión reciente | `git --version` |
| Bruno CLI (opcional para CLI directo) | última versión | `bru --version` |

> **Bruno Desktop (opcional):** Para abrir y editar las colecciones visualmente, descarga la app desde [usebruno.com](https://www.usebruno.com/). No es requerida para ejecutar las pruebas desde este framework.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/lrbg/frameAPIGlobal.git
cd frameAPIGlobal
```

### 2. Instalar todas las dependencias

```bash
npm run install:all
```

Este comando instala:
- Dependencias raíz del workspace (`concurrently`)
- Dependencias del backend (`express`, `cors`, `fs-extra`, `uuid`)
- Dependencias del frontend (`react`, `react-router-dom`, `swagger-ui-react`, `recharts`, `tailwindcss`, etc.)
- Dependencias de desarrollo del backend (`@usebruno/cli`, `nodemon`)

### 3. Instalar Bruno CLI globalmente (recomendado)

```bash
npm install -g @usebruno/cli
bru --version   # verificar instalación
```

---

## Configuración

### Variables de entorno del backend (opcional)

Crea un archivo `.env` en `backend/` si necesitas personalizar el puerto:

```env
PORT=3001
```

El valor por defecto es `3001`. No hay otras variables requeridas para el ejemplo con PokéAPI.

### Variables de entorno de Bruno (colecciones)

Las variables de entorno para las pruebas están definidas en:

```
collections/pokeapi/environments/Prod.bru
```

```
vars {
  baseUrl: https://pokeapi.co/api/v2
  pokemonName: pikachu
  berryName: cheri
  itemName: master-ball
  moveName: pound
  typeName: fire
  abilityName: stench
}
```

Puedes cambiar los valores (por ejemplo `pokemonName: ditto`) para probar con diferentes recursos. Esto afecta a todos los endpoints que usan `{{pokemonName}}` como parámetro.

---

## Uso Local — Modo Completo

### 1. Iniciar el Backend

```bash
# Opción A: desde la raíz del proyecto
npm run dev

# Opción B: solo el backend (sin frontend)
cd backend && npm run dev
```

El servidor Express queda disponible en: **http://localhost:3001**

Verifica que está corriendo:
```bash
curl http://localhost:3001/api/health
# {"status":"ok","timestamp":"2026-04-17T..."}
```

### 2. Iniciar el Frontend

```bash
# Desde la raíz (junto con el backend, si usas npm run dev)
npm run dev

# O solo el frontend:
cd frontend && npm run dev
```

El dashboard queda disponible en: **http://localhost:3000**

> El frontend tiene configurado un proxy a `localhost:3001` para la ruta `/api`, por lo que no necesitas configurar CORS manualmente en desarrollo.

### 3. Ejecutar Tests con Bruno CLI

#### Correr todos los tests

```bash
npm run test:bruno
```

O directamente con `bru`:

```bash
cd collections/pokeapi
bru run --env Prod --no-bail
```

#### Correr solo un grupo de recursos

```bash
cd collections/pokeapi

# Solo Pokemon
bru run --env Prod --no-bail pokemon/

# Solo Berry
bru run --env Prod --no-bail berry/

# Solo Item
bru run --env Prod --no-bail item/

# Solo Move
bru run --env Prod --no-bail move/

# Solo Type
bru run --env Prod --no-bail type/

# Solo Ability
bru run --env Prod --no-bail ability/
```

#### Correr con reporte JSON

```bash
cd collections/pokeapi
bru run --env Prod --no-bail --reporter-json ../../backend/results/latest.json
```

El archivo JSON resultante sigue la estructura de Bruno con `summary.passedTestCount`, `summary.failedTestCount` y un array `results` con cada test.

#### Correr un solo archivo `.bru`

```bash
cd collections/pokeapi
bru run pokemon/get-pokemon.bru --env Prod
```

### 4. API del Backend

Con el backend corriendo en `localhost:3001`, tienes disponibles estos endpoints:

#### `GET /api/health`
Verifica que el servidor está activo.
```bash
curl http://localhost:3001/api/health
```

#### `GET /api/collections`
Lista todas las colecciones Bruno y sus tests.
```bash
curl http://localhost:3001/api/collections
```
Respuesta:
```json
{
  "collection": "PokéAPI QA Collection",
  "groups": [
    { "name": "pokemon", "count": 2, "tests": [...] },
    { "name": "berry", "count": 2, "tests": [...] }
  ],
  "total": 12
}
```

#### `POST /api/run-tests`
Ejecuta las pruebas Bruno y devuelve los resultados.
```bash
# Ejecutar todos los tests
curl -X POST http://localhost:3001/api/run-tests \
  -H "Content-Type: application/json" \
  -d '{}'

# Ejecutar solo un grupo
curl -X POST http://localhost:3001/api/run-tests \
  -H "Content-Type: application/json" \
  -d '{"folder": "pokemon"}'
```
Respuesta:
```json
{
  "runId": "uuid-v4",
  "timestamp": "2026-04-17T21:00:00.000Z",
  "duration": 3200,
  "folder": "pokemon",
  "passed": 10,
  "failed": 0,
  "total": 10,
  "results": { ... }
}
```

#### `GET /api/results`
Devuelve el historial de los últimos 20 runs.
```bash
curl http://localhost:3001/api/results
```

#### `GET /api/results/latest`
Devuelve el resultado del último run.
```bash
curl http://localhost:3001/api/results/latest
```

#### `GET /api/results/:runId`
Devuelve el resultado de un run específico por su UUID.
```bash
curl http://localhost:3001/api/results/a1b2c3d4-...
```

#### `GET /api/swagger`
Devuelve la especificación OpenAPI 3.0 generada desde las colecciones Bruno.
```bash
curl http://localhost:3001/api/swagger | python3 -m json.tool
```

### 5. Generar Swagger Estático

Para regenerar el archivo `frontend/public/data/swagger.json` desde las colecciones:

```bash
npm run generate:swagger
```

Útil cuando modificas colecciones y quieres actualizar la documentación localmente sin correr los tests completos.

---

## Endpoints Cubiertos y Tests

### Resumen

| Recurso | Endpoint List | Endpoint Get | Assertions |
|---------|--------------|--------------|-----------|
| Pokemon | `GET /pokemon` | `GET /pokemon/{name}` | 10 |
| Berry | `GET /berry` | `GET /berry/{name}` | 6 |
| Item | `GET /item` | `GET /item/{name}` | 7 |
| Move | `GET /move` | `GET /move/{name}` | 8 |
| Type | `GET /type` | `GET /type/{name}` | 7 |
| Ability | `GET /ability` | `GET /ability/{name}` | 7 |

**Total: 12 endpoints · ~45 assertions**

### Qué valida cada test

Cada par de endpoints (list + get) valida:

| Tipo de assertion | Descripción |
|-------------------|-------------|
| **Status Code** | `res.status === 200` |
| **Estructura del body** | Propiedades principales existen (`id`, `name`, etc.) |
| **Tipos de datos** | Que `id` sea número, `name` sea string, arrays sean arrays |
| **Contenido no vacío** | Arrays con al menos un elemento |
| **Sub-objetos** | Propiedades anidadas (e.g. `sprites.front_default`, `damage_class.name`) |
| **Tiempo de respuesta** | `responseTime < 3000ms` |

---

## Estructura de un Archivo Bruno (.bru)

Cada endpoint tiene un archivo `.bru` con la siguiente estructura:

```
meta {
  name: Get Pokemon by Name    ← nombre del test (aparece en reportes)
  type: http
  seq: 2                       ← orden de ejecución dentro de la carpeta
}

get {
  url: {{baseUrl}}/pokemon/{{pokemonName}}   ← usa variables del entorno
  body: none
  auth: none
}

tests {
  test("Status 200 - Pokemon found", function() {
    expect(res.getStatus()).to.equal(200);
  });

  test("Response has types array", function() {
    expect(res.getBody()).to.have.property('types');
    expect(res.getBody().types).to.be.an('array');
    expect(res.getBody().types.length).to.be.greaterThan(0);
  });

  test("Response time is under 3000ms", function() {
    expect(res.getResponseTime()).to.be.below(3000);
  });
}

assert {
  res.status: eq 200             ← assertions rápidas de Bruno (sin JS)
  res.body.id: isDefined
  res.body.name: isDefined
}
```

**Variables disponibles en `{{...}}`:**

| Variable | Valor por defecto | Usado en |
|----------|------------------|---------|
| `{{baseUrl}}` | `https://pokeapi.co/api/v2` | todos |
| `{{pokemonName}}` | `pikachu` | pokemon/ |
| `{{berryName}}` | `cheri` | berry/ |
| `{{itemName}}` | `master-ball` | item/ |
| `{{moveName}}` | `pound` | move/ |
| `{{typeName}}` | `fire` | type/ |
| `{{abilityName}}` | `stench` | ability/ |

---

## Dashboard — Guía de Uso

El dashboard tiene 4 secciones accesibles desde la barra de navegación:

### Dashboard (inicio)

Muestra un resumen del último run con:
- **Pass Rate** como métrica principal
- **Gráfica de pastel** con distribución Passed / Failed del último run
- **Gráfica de barras** con historial de los últimos 10 runs
- **Accesos rápidos** a Test Runner, Results y Documentation

### Test Runner

Permite ejecutar tests desde el navegador:

1. Selecciona el grupo de recursos (o "All Resources" para todos)
2. Presiona **Run Tests**
3. El frontend llama a `POST /api/run-tests` en el backend local
4. Los resultados aparecen con: summary de passed/failed/total/duración, detalle de cada test y output raw

> **Nota:** El Test Runner requiere que el backend esté corriendo localmente (`npm run dev`). En GitHub Pages (modo estático) mostrará un mensaje indicando que se necesita el backend o que se puede disparar desde GitHub Actions.

### Results

Historial de todas las ejecuciones pasadas, expandible por run:
- Estado general (verde = todo pasó, rojo = hubo fallos)
- Timestamp y duración
- Detalle de cada test al expandir

Los datos se leen de `frontend/public/data/history.json` (actualizado por CI).

### Documentation

Swagger UI con la especificación OpenAPI 3.0 generada automáticamente desde las colecciones Bruno. Incluye:
- Lista de todos los endpoints agrupados por recurso (tag)
- Parámetros de path y query con sus tipos
- Respuestas posibles (200, 404)
- Las assertions de Bruno como descripción de cada endpoint

---

## GitHub Actions — CI/CD

### Workflow 1: `run-tests.yml` — Ejecutar Pruebas

**Triggers:**
- Push a `main` que modifique archivos en `collections/**` o el propio workflow
- Pull Request hacia `main`
- Disparo manual desde la UI de GitHub Actions

**Lo que hace:**
1. Instala Node.js y Bruno CLI globalmente
2. Corre `bru run --env Prod --no-bail` desde `collections/pokeapi/`
3. Genera un JSON de resumen con `runId`, `timestamp`, `passed`, `failed`, `total`
4. Actualiza `frontend/public/data/latest.json` y `history.json`
5. Genera `frontend/public/data/swagger.json` usando `scripts/generate-swagger.js`
6. Sube el resultado como artefacto descargable
7. Hace commit automático de los archivos JSON actualizados
8. Falla el workflow si hay tests fallando (exit code 1)

**Disparo manual con filtro de carpeta:**

1. Ve a **Actions** → **Run Bruno Tests**
2. Haz clic en **Run workflow**
3. Selecciona el grupo de recursos en el dropdown
4. Haz clic en **Run workflow**

Opciones disponibles: `(vacío = todos)`, `pokemon`, `berry`, `item`, `move`, `type`, `ability`

### Workflow 2: `deploy.yml` — Desplegar a GitHub Pages

**Triggers:**
- Push a `main` (cualquier cambio)
- Disparo manual

**Lo que hace:**
1. Instala dependencias del frontend
2. Verifica que existan los archivos `data/*.json` (crea placeholders si no)
3. Ejecuta `vite build` para generar el bundle de producción
4. Sube el artefacto a GitHub Pages
5. Despliega automáticamente

**URL del resultado:** `https://lrbg.github.io/frameAPIGlobal/`

---

## GitHub Pages — Despliegue Público

### Habilitar GitHub Pages (solo necesario la primera vez)

1. Ve a **Settings** → **Pages** en tu repositorio
2. En **Source**, selecciona **GitHub Actions**
3. Guarda los cambios
4. Haz un push a `main` — el workflow `deploy.yml` se ejecutará automáticamente

### Modo de operación en GitHub Pages

Dado que GitHub Pages sirve únicamente archivos estáticos (sin servidor Node.js), el dashboard funciona en **modo estático**:

| Funcionalidad | Modo local | GitHub Pages |
|---------------|-----------|--------------|
| Ver Dashboard | ✅ | ✅ |
| Ver Results históricos | ✅ | ✅ (datos de CI) |
| Ver Swagger Docs | ✅ | ✅ (datos de CI) |
| Ejecutar tests (botón Run) | ✅ | ⚠️ Requiere backend local |
| Datos actualizados automáticamente | Manual | ✅ En cada push |

Los datos del dashboard en GitHub Pages se actualizan automáticamente cada vez que el workflow `run-tests.yml` corre y hace commit de los archivos JSON.

---

## Agregar Nuevos Endpoints

### 1. Crear el archivo `.bru`

Crea un archivo en la carpeta correspondiente (o una nueva carpeta para un nuevo recurso):

```bash
# Ejemplo: agregar endpoint de species
touch collections/pokeapi/pokemon/get-species.bru
```

Contenido del archivo:

```
meta {
  name: Get Pokemon Species
  type: http
  seq: 3
}

get {
  url: {{baseUrl}}/pokemon-species/{{pokemonName}}
  body: none
  auth: none
}

tests {
  test("Status 200", function() {
    expect(res.getStatus()).to.equal(200);
  });

  test("Has name", function() {
    expect(res.getBody()).to.have.property('name');
  });

  test("Response time under 3000ms", function() {
    expect(res.getResponseTime()).to.be.below(3000);
  });
}

assert {
  res.status: eq 200
  res.body.name: isDefined
}
```

### 2. Agregar una nueva carpeta de recurso

Si el endpoint pertenece a un recurso completamente nuevo:

```bash
mkdir collections/pokeapi/location
touch collections/pokeapi/location/list-location.bru
touch collections/pokeapi/location/get-location.bru
```

### 3. Agregar variable de entorno (si usa parámetros nuevos)

Edita `collections/pokeapi/environments/Prod.bru`:

```
vars {
  baseUrl: https://pokeapi.co/api/v2
  pokemonName: pikachu
  ...
  locationName: pallet-town    ← agregar aquí
}
```

### 4. Regenerar la documentación Swagger

```bash
npm run generate:swagger
```

### 5. Verificar localmente

```bash
cd collections/pokeapi
bru run location/list-location.bru --env Prod
```

### 6. Commit y push

Al hacer push a `main`, GitHub Actions correrá automáticamente los nuevos tests y actualizará el dashboard.

---

## Estructura Completa del Proyecto

```
frameAPIGlobal/
│
├── .github/
│   └── workflows/
│       ├── run-tests.yml       # CI: ejecuta Bruno tests y actualiza JSON de datos
│       └── deploy.yml          # CD: build y deploy del frontend a GitHub Pages
│
├── collections/
│   └── pokeapi/
│       ├── bruno.json          # Manifiesto de la colección Bruno
│       ├── environments/
│       │   └── Prod.bru        # Variables de entorno (baseUrl, nombres de recursos)
│       ├── pokemon/
│       │   ├── list-pokemon.bru
│       │   └── get-pokemon.bru
│       ├── berry/
│       │   ├── list-berry.bru
│       │   └── get-berry.bru
│       ├── item/
│       │   ├── list-item.bru
│       │   └── get-item.bru
│       ├── move/
│       │   ├── list-move.bru
│       │   └── get-move.bru
│       ├── type/
│       │   ├── list-type.bru
│       │   └── get-type.bru
│       └── ability/
│           ├── list-ability.bru
│           └── get-ability.bru
│
├── backend/
│   ├── package.json
│   ├── results/
│   │   ├── .gitkeep
│   │   └── *.json              # Resultados de runs locales (ignorados por git)
│   └── src/
│       ├── server.js           # Servidor Express, define rutas y puerto
│       └── routes/
│           ├── tests.js        # GET /api/collections, POST /api/run-tests
│           ├── results.js      # GET /api/results, /results/latest, /results/:id
│           └── docs.js         # GET /api/swagger (genera OpenAPI desde .bru)
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js          # Base path /frameAPIGlobal/, proxy a :3001
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   │   ├── favicon.svg
│   │   └── data/               # Archivos JSON estáticos (actualizados por CI)
│   │       ├── swagger.json    # Spec OpenAPI generada desde colecciones Bruno
│   │       ├── latest.json     # Resultado del último test run
│   │       └── history.json    # Historial de los últimos 20 runs
│   └── src/
│       ├── main.jsx            # Entry point, HashRouter (compatible con GitHub Pages)
│       ├── App.jsx             # Rutas principales
│       ├── index.css           # Tailwind + custom component classes
│       ├── services/
│       │   └── api.js          # api (→ backend local) y staticApi (→ archivos JSON)
│       ├── components/
│       │   ├── Navbar.jsx      # Navegación principal
│       │   ├── StatCard.jsx    # Tarjeta de estadística
│       │   ├── TestCard.jsx    # Fila de resultado individual
│       │   ├── ResultBadge.jsx # Badge passed/failed
│       │   └── LoadingSpinner.jsx
│       └── pages/
│           ├── Dashboard.jsx   # Vista principal con charts y stats
│           ├── TestRunner.jsx  # Selector de grupo + botón Run + resultados
│           ├── Results.jsx     # Historial de runs expandibles
│           └── Documentation.jsx # Swagger UI embed
│
├── scripts/
│   └── generate-swagger.js     # Genera swagger.json desde colecciones .bru
│
├── package.json                # Workspace raíz, scripts globales
├── package-lock.json
├── .gitignore
└── README.md
```

---

## Solución de Problemas

### `bru: command not found`

Bruno CLI no está instalado globalmente o no está en el PATH.

```bash
npm install -g @usebruno/cli
# Si sigue sin funcionar, verifica el PATH de npm global:
npm config get prefix
# Agrega {prefix}/bin a tu PATH
```

### `Error: ENOENT: no such file or directory, open 'backend/results/latest.json'`

El comando `bru run` no generó el archivo de resultados, normalmente porque falló antes de escribirlo. Verifica:

```bash
# ¿Existe la carpeta results?
ls backend/results/

# Crea la carpeta si no existe
mkdir -p backend/results

# Corre manualmente para ver el error
cd collections/pokeapi
bru run --env Prod --reporter-json ../../backend/results/latest.json --no-bail
```

### El backend devuelve `500` al llamar `POST /api/run-tests`

Verifica que `bru` esté accesible desde el proceso Node.js:

```bash
# El backend busca el binario en este orden:
# 1. node_modules/.bin/bru (workspace root)
# 2. backend/node_modules/.bin/bru
# 3. bru global

# Para asegurarte, instala @usebruno/cli como dev dependency del backend:
cd backend && npm install --save-dev @usebruno/cli
```

### El frontend muestra "Backend not reachable"

El backend no está corriendo. Inícialo con:

```bash
cd backend && npm run dev
# O desde la raíz:
npm run dev
```

### La página de Swagger está vacía o muestra "Documentation unavailable"

El archivo `frontend/public/data/swagger.json` no existe o está vacío. Genera manualmente:

```bash
npm run generate:swagger
```

Si estás en GitHub Pages, el archivo se genera automáticamente en cada run de CI. Verifica que el workflow `run-tests.yml` haya corrido correctamente.

### Error en GitHub Actions: `You can run only at the root of a collection`

Bruno requiere ejecutarse desde el directorio que contiene `bruno.json`. El workflow ya tiene configurado `working-directory: collections/pokeapi`. Verifica que `collections/pokeapi/bruno.json` exista en el repositorio.

### Error en GitHub Actions: `fatal: unable to access ... error: 403`

El workflow de auto-commit necesita permiso de escritura. Verifica que `run-tests.yml` tenga:

```yaml
permissions:
  contents: write
```

---

## Comandos de Referencia Rápida

```bash
# Instalación completa
npm run install:all

# Desarrollo (backend + frontend)
npm run dev

# Solo backend
cd backend && npm run dev

# Solo frontend
cd frontend && npm run dev

# Correr todos los tests Bruno
npm run test:bruno

# Correr tests de un recurso específico
cd collections/pokeapi && bru run --env Prod --no-bail pokemon/

# Regenerar Swagger estático
npm run generate:swagger

# Build de producción del frontend
npm run build

# Ver resultado del último run (requiere backend)
curl http://localhost:3001/api/results/latest | python3 -m json.tool

# Ver especificación Swagger (requiere backend)
curl http://localhost:3001/api/swagger | python3 -m json.tool
```
