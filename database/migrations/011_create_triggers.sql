-- ============================================================
-- MIGRACIÓN 011: TRIGGERS para updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['empresas','usuarios','categorias','ubicaciones','responsables','activos'] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %s
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
            t, t
        );
    END LOOP;
END;
$$;

-- Función para generar código automático de activo
CREATE OR REPLACE FUNCTION generar_codigo_activo(p_tenant_id UUID, p_prefijo VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_contador INTEGER;
    v_codigo   VARCHAR;
BEGIN
    SELECT COUNT(*) + 1
    INTO v_contador
    FROM activos
    WHERE tenant_id = p_tenant_id
      AND codigo LIKE p_prefijo || '%';

    v_codigo := p_prefijo || '-' || LPAD(v_contador::TEXT, 4, '0');
    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_set_updated_at() IS 'Actualiza updated_at automáticamente en cada UPDATE';
COMMENT ON FUNCTION generar_codigo_activo(UUID, VARCHAR) IS 'Genera código secuencial por prefijo y tenant';
