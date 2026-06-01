# Architecture Decision Record

**Job ID:** `2ce8dac1-4d7d-40ea-9e4e-2124b26407ba`  
**Generated:** 2026-06-01 03:40 UTC  
**Requirement:** Crear una aplicación de calculadora completa en Node.js con Express
  que tenga interfaz web y guarde el historial en MySQL.

  BACKEND (API REST):
  - POST /calculate — recibe { operation, a, b } don

## Components

### Express App Entry Point `service`
Inicializa Express, monta rutas, sirve archivos estáticos y arranca el servidor HTTP

### Database Module `module`
Gestiona la conexión MySQL con mysql2, crea la tabla calculations si no existe y expone funciones CRUD

### Calculator Router `module`
Define los endpoints POST /calculate, GET /history y DELETE /history/:id con validación y lógica de negocio

### Frontend SPA `module`
Interfaz web HTML/CSS/JS embebido servida estáticamente: inputs, botones de operación, resultado y panel de historial con eliminación

### Integration Tests `test`
Tests Jest que verifican los 4 endpoints contra MySQL real, incluyendo casos de error 400

### Smoke Test `test`
Test Jest que arranca el servidor y verifica que responde 200 en GET /

## Architecture Decisions

### mysql2 con pool de conexiones y MYSQL_URL
**Decision:** Usar mysql2/promise con createPool parseando MYSQL_URL para obtener host/port/user/password/database
**Rationale:** mysql2 está disponible globalmente en el sandbox, MYSQL_URL está garantizada como variable de entorno, pool evita overhead de reconexión en tests concurrentes

### Separar app.js del listen para testabilidad
**Decision:** src/app.js exporta la instancia Express sin llamar listen(); un bloque if(require.main===module) arranca el servidor
**Rationale:** Permite que los tests importen la app y llamen supertest sin conflictos de puerto ni necesidad de mocks del servidor

### Jest como framework de testing
**Decision:** Usar Jest con supertest para tests de integración y smoke
**Rationale:** Jest está disponible en el sandbox (jest en package.json), supertest permite hacer peticiones HTTP a la app Express sin levantar puerto real

### Frontend sin frameworks externos
**Decision:** HTML/CSS/JS vanilla embebido en un único public/index.html servido por express.static
**Rationale:** El requerimiento prohíbe frameworks externos; vanilla fetch API cubre las necesidades de comunicación con la API REST

### Creación automática de tabla en startup
**Decision:** db.js ejecuta CREATE TABLE IF NOT EXISTS calculations al inicializar el pool, antes de que la app acepte peticiones
**Rationale:** Garantiza que la tabla existe sin migraciones externas, simplifica el despliegue y los tests de integración

## Risks

- Si MYSQL_URL no está definida en el entorno de test, los tests de integración fallarán con error de conexión; se mitiga con un check explícito al inicio de db.js
- mysql2 puede no estar instalado globalmente como módulo Node.js accesible; el package.json debe declararlo como dependencia para que npm install lo resuelva
- supertest no está listado explícitamente en el sandbox; se declara como devDependency en package.json y se instala vía npm install antes de ejecutar tests
- Concurrencia en tests: si varios tests insertan y borran filas simultáneamente puede haber interferencia; se mitiga con afterAll que limpia la tabla de tests
- División por cero devuelve 400 pero MySQL podría recibir la petición antes de la validación si el orden de middleware es incorrecto; la validación debe ser la primera operación en el handler

## Files

**To create:**
- `package.json`
- `src/app.js`
- `src/db.js`
- `src/routes/calculator.js`
- `public/index.html`
- `tests/integration.test.js`
- `tests/smoke.test.js`

**To modify:**
- `README.md`