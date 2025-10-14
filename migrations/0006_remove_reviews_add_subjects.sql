-- 0006_remove_reviews_add_subjects.sql — Eliminar reseñas y agregar materias/departamentos
-- Eliminar funcionalidad de reseñas y calificaciones, mostrar materias y departamentos

-- Eliminar vistas que dependen de reseñas
DROP VIEW IF EXISTS v_profesores_estadisticas;
DROP VIEW IF EXISTS v_profesores_ratings_por_semestre;

-- Eliminar tabla de reseñas
DROP TABLE IF EXISTS resenas CASCADE;

-- Eliminar tabla de profesores_favoritos (no necesaria sin reseñas)
DROP TABLE IF EXISTS profesores_favoritos CASCADE;

-- Crear nueva vista para mostrar materias activas del profesor
CREATE OR REPLACE VIEW v_profesores_materias_activas AS
SELECT 
    pm.profesor_id, 
    m.id as materia_id, 
    m.nombre as materia_nombre,
    m.codigo as materia_codigo,
    d.id as departamento_id,
    d.nombre as departamento_nombre,
    u.id as universidad_id,
    u.nombre as universidad_nombre
FROM profesores_materias pm
JOIN materias m ON m.id = pm.materia_id
JOIN departamentos d ON d.id = m.departamento_id
JOIN universidades u ON u.id = d.universidad_id
WHERE pm.activo = true;

-- Crear vista para información completa del profesor con departamento y universidad
CREATE OR REPLACE VIEW v_profesores_completo AS
SELECT 
    p.id,
    p.nombre_completo,
    p.email,
    p.bio,
    p.created_at,
    d.id as departamento_id,
    d.nombre as departamento_nombre,
    u.id as universidad_id,
    u.nombre as universidad_nombre
FROM profesores p
JOIN departamentos d ON d.id = p.departamento_id
JOIN universidades u ON u.id = d.universidad_id;

-- Crear vista para materias por departamento (útil para filtros)
CREATE OR REPLACE VIEW v_materias_por_departamento AS
SELECT 
    m.id,
    m.nombre,
    m.codigo,
    m.departamento_id,
    d.nombre as departamento_nombre,
    u.nombre as universidad_nombre
FROM materias m
JOIN departamentos d ON d.id = m.departamento_id
JOIN universidades u ON u.id = d.universidad_id;

-- Índices útiles para las nuevas consultas
CREATE INDEX IF NOT EXISTS idx_profesores_materias_activo ON profesores_materias(activo);
CREATE INDEX IF NOT EXISTS idx_materias_departamento ON materias(departamento_id);
CREATE INDEX IF NOT EXISTS idx_departamentos_universidad ON departamentos(universidad_id);
