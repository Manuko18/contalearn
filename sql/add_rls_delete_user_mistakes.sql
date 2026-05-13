-- Permite a cada usuario eliminar sus propios errores en user_mistakes
-- Necesario para que /repasar pueda limpiar errores dominados desde cualquier dispositivo
CREATE POLICY "usuarios pueden eliminar sus propios errores"
ON user_mistakes
FOR DELETE
USING (auth.uid() = user_id);
