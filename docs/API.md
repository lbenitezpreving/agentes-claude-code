# API Documentation

## Base URL

`http://localhost:8000`

## Endpoints

### Health

#### GET /

Health check endpoint.

**Response (200):**
```json
{
  "status": "ok",
  "message": "API running"
}
```

#### GET /health

Detailed health check.

**Response (200):**
```json
{
  "status": "healthy"
}
```

---

*Esta documentación se actualiza automáticamente usando `/document-api`*
