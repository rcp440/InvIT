-- Permite revocar refresh tokens en logout o cambio de contraseña.
-- Se almacena el hash (bcrypt, 6 rondas) para no guardar el token en claro.

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS refresh_token_exp  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_usuarios_refresh_token_exp
    ON usuarios (refresh_token_exp)
    WHERE refresh_token_hash IS NOT NULL;
