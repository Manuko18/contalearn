-- =====================================================================
-- ContaLearn — Fix completo de contenido
-- EJECUTAR EN SUPABASE SQL EDITOR
--
-- Qué hace este script:
-- 1. Fix niveles 6-7-8: renombra 'respuesta' → 'respuesta_correcta'
-- 2. Fix TODOS los niveles: renombra 'explicacion' → 'explicacion_error'
--    (el código lee explicacion_error, no explicacion)
-- 3. Reescribe teoria + preguntas de nivel 1 (Fundamentos)
--    alineando cada pregunta con lo que explica la teoría
-- 4. Reescribe teoria + preguntas de nivel 2 (Ecuación Contable)
--    alineando cada pregunta con lo que explica la teoría
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- PARTE 1: Fix campo 'respuesta' → 'respuesta_correcta' en niveles 6,7,8
-- ─────────────────────────────────────────────────────────────────────
UPDATE lecciones
SET contenido_json =
  (contenido_json - 'respuesta') ||
  jsonb_build_object('respuesta_correcta', contenido_json->'respuesta')
WHERE nivel_id IN (SELECT id FROM niveles WHERE orden IN (6, 7, 8))
  AND contenido_json ? 'respuesta';


-- ─────────────────────────────────────────────────────────────────────
-- PARTE 2: Fix campo 'explicacion' → 'explicacion_error' en TODOS
-- ─────────────────────────────────────────────────────────────────────
UPDATE lecciones
SET contenido_json =
  (contenido_json - 'explicacion') ||
  jsonb_build_object('explicacion_error', contenido_json->'explicacion')
WHERE contenido_json ? 'explicacion';


-- ─────────────────────────────────────────────────────────────────────
-- PARTE 3: Nivel 1 — Fundamentos
-- Teoria 100% alineada con las preguntas
-- ─────────────────────────────────────────────────────────────────────
UPDATE niveles
SET teoria_json = '[
  {
    "titulo": "¿Qué es la Contabilidad?",
    "contenido": "La contabilidad es el sistema que registra, clasifica y resume los hechos económicos de una empresa. Según el Marco Conceptual de las NIIF (Normas Internacionales de Información Financiera), su objetivo es proporcionar información financiera útil para que inversores, acreedores y otros usuarios externos puedan tomar decisiones económicas."
  },
  {
    "titulo": "El Activo según las NIIF",
    "contenido": "El Marco Conceptual de las NIIF define el ACTIVO como un recurso controlado por la entidad como resultado de sucesos pasados, del que se espera obtener beneficios económicos futuros. Las NIIF hablan de CONTROL, no de propiedad legal: un bien puede ser activo aunque no se sea dueño legal si se controla. Ejemplos: efectivo en caja, cuentas por cobrar, inventarios, maquinaria."
  },
  {
    "titulo": "Pasivo y Patrimonio según las NIIF",
    "contenido": "El PASIVO es una obligación presente de la entidad, surgida de sucesos pasados, cuya cancelación implica una salida de recursos con beneficios económicos. Ejemplo: un préstamo bancario. El PATRIMONIO es la participación residual en los activos una vez deducidos todos los pasivos. Se calcula como Activos menos Pasivos. Las NIIF son las Normas Internacionales de Información Financiera, usadas en Colombia y la mayoría de países."
  }
]'
WHERE orden = 1;

-- Limpiar nivel 1
DELETE FROM progreso_usuario
WHERE leccion_id IN (SELECT id FROM lecciones WHERE nivel_id = (SELECT id FROM niveles WHERE orden = 1));
DELETE FROM lecciones WHERE nivel_id = (SELECT id FROM niveles WHERE orden = 1);

-- Preguntas nivel 1 (basadas exclusivamente en las 3 slides anteriores)
INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 1, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál es el objetivo de la contabilidad según el Marco Conceptual NIIF?","opciones":["Proporcionar información útil para que inversores y acreedores tomen decisiones","Calcular los impuestos anuales de la empresa","Auditar los estados financieros de terceros","Controlar el inventario de mercancías"],"respuesta_correcta":"Proporcionar información útil para que inversores y acreedores tomen decisiones","explicacion_error":"El Marco Conceptual NIIF establece que el objetivo de la información financiera es ser útil para inversores, acreedores y otros usuarios externos en su toma de decisiones."}'::jsonb
FROM niveles WHERE orden = 1;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 2, 'verdadero_falso', 1,
  '{"pregunta":"Según las NIIF, un activo es un recurso controlado por la empresa del que se esperan obtener beneficios económicos futuros.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion_error":"Correcto. La definición NIIF de activo requiere: control por la entidad, origen en sucesos pasados, y expectativa de beneficios económicos futuros."}'::jsonb
FROM niveles WHERE orden = 1;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 3, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál de estos es un ejemplo de ACTIVO?","opciones":["Efectivo en caja","Préstamo bancario por pagar","Capital aportado por los socios","Dividendos por pagar"],"respuesta_correcta":"Efectivo en caja","explicacion_error":"El efectivo es un activo: recurso controlado por la empresa del que se esperan beneficios. El préstamo es un pasivo. El capital y los dividendos se relacionan con el patrimonio."}'::jsonb
FROM niveles WHERE orden = 1;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 4, 'opcion_multiple', 1,
  '{"pregunta":"Según el Marco Conceptual NIIF, el PASIVO es:","opciones":["Una obligación presente surgida de sucesos pasados que implica salida de recursos","Un recurso controlado por la empresa","La participación residual de los propietarios","Un ingreso pendiente de reconocer"],"respuesta_correcta":"Una obligación presente surgida de sucesos pasados que implica salida de recursos","explicacion_error":"El PASIVO según NIIF es una obligación presente, originada en hechos pasados, que al cancelarse implica salida de recursos con beneficios económicos."}'::jsonb
FROM niveles WHERE orden = 1;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 5, 'verdadero_falso', 1,
  '{"pregunta":"El PATRIMONIO de una empresa se calcula como: Activos menos Pasivos.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion_error":"Correcto. Patrimonio = Activos − Pasivos. Es la participación residual de los propietarios en la empresa una vez cubiertas todas las deudas."}'::jsonb
FROM niveles WHERE orden = 1;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 6, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál de estos es un ejemplo de PASIVO?","opciones":["Préstamo bancario pendiente de pago","Efectivo en caja","Maquinaria de la empresa","Capital aportado por los socios"],"respuesta_correcta":"Préstamo bancario pendiente de pago","explicacion_error":"Un préstamo bancario es una obligación presente (deuda) surgida de un hecho pasado (recibir el dinero), cuyo pago implica salida de recursos. Por eso es PASIVO según las NIIF."}'::jsonb
FROM niveles WHERE orden = 1;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 7, 'verdadero_falso', 1,
  '{"pregunta":"Según las NIIF, para que algo sea un activo es obligatorio que la empresa sea su propietario legal.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Falso","explicacion_error":"Las NIIF hablan de CONTROL, no de propiedad legal. Un bien puede ser activo de quien lo controla aunque legalmente pertenezca a otro, como ocurre con los arrendamientos financieros."}'::jsonb
FROM niveles WHERE orden = 1;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 8, 'opcion_multiple', 1,
  '{"pregunta":"NIIF son las siglas de:","opciones":["Normas Internacionales de Información Financiera","Normas Internas de Inversión Financiera","Normativa Internacional de Impuestos y Finanzas","Normas de Información Interna Financiera"],"respuesta_correcta":"Normas Internacionales de Información Financiera","explicacion_error":"NIIF = Normas Internacionales de Información Financiera (en inglés: IFRS). Son el marco contable internacional adoptado en Colombia y la mayoría de países."}'::jsonb
FROM niveles WHERE orden = 1;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 9, 'opcion_multiple', 1,
  '{"pregunta":"¿Quiénes son los principales usuarios de la información contable según el Marco Conceptual NIIF?","opciones":["Inversores y acreedores externos","Solo el gerente y los empleados","Únicamente el gobierno y la DIAN","Los clientes y proveedores exclusivamente"],"respuesta_correcta":"Inversores y acreedores externos","explicacion_error":"El Marco Conceptual NIIF identifica como usuarios principales a inversores (actuales y potenciales) y acreedores, quienes necesitan la información para tomar decisiones económicas."}'::jsonb
FROM niveles WHERE orden = 1;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 10, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué disciplina registra, clasifica y resume los hechos económicos de una empresa?","opciones":["La contabilidad","La auditoría","La estadística","La administración"],"respuesta_correcta":"La contabilidad","explicacion_error":"La contabilidad es el sistema que registra, clasifica y resume los hechos económicos para producir información financiera útil para la toma de decisiones."}'::jsonb
FROM niveles WHERE orden = 1;


-- ─────────────────────────────────────────────────────────────────────
-- PARTE 4: Nivel 2 — Ecuación Contable
-- ─────────────────────────────────────────────────────────────────────
UPDATE niveles
SET teoria_json = '[
  {
    "titulo": "La Ecuación Contable Fundamental",
    "contenido": "La ecuación contable es la base de toda la contabilidad: ACTIVO = PASIVO + PATRIMONIO. Esta ecuación siempre debe estar en equilibrio. Significa que todos los recursos de la empresa (Activo) están financiados por deudas con terceros como bancos y proveedores (Pasivo) o por los propietarios de la empresa (Patrimonio). También se puede despejar como: Patrimonio = Activo − Pasivo."
  },
  {
    "titulo": "Ejemplos de la Ecuación Contable",
    "contenido": "Ejemplo: una empresa tiene activos por $100 millones. Si debe $40 millones a bancos y proveedores (Pasivo), entonces el Patrimonio de los dueños es $60 millones. La ecuación se cumple: $100M = $40M + $60M. Otro ejemplo: si Activo = $800.000 y Patrimonio = $350.000, entonces Pasivo = $800.000 − $350.000 = $450.000."
  },
  {
    "titulo": "Cómo afectan las transacciones la Ecuación",
    "contenido": "Cada transacción mantiene siempre el equilibrio. Si la empresa recibe un préstamo: el Activo (caja) y el Pasivo (deuda) aumentan por igual. Si un socio aporta capital: el Activo (caja) y el Patrimonio aumentan por igual. Si se paga una deuda con efectivo: el Activo (caja) y el Pasivo (deuda) disminuyen por igual. La ecuación Activo = Pasivo + Patrimonio nunca se rompe."
  }
]'
WHERE orden = 2;

-- Limpiar nivel 2
DELETE FROM progreso_usuario
WHERE leccion_id IN (SELECT id FROM lecciones WHERE nivel_id = (SELECT id FROM niveles WHERE orden = 2));
DELETE FROM lecciones WHERE nivel_id = (SELECT id FROM niveles WHERE orden = 2);

-- Preguntas nivel 2
INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 1, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál es la ecuación contable fundamental?","opciones":["Activo = Pasivo + Patrimonio","Activo = Pasivo − Patrimonio","Pasivo = Activo + Patrimonio","Patrimonio = Activo + Pasivo"],"respuesta_correcta":"Activo = Pasivo + Patrimonio","explicacion_error":"La ecuación contable fundamental es Activo = Pasivo + Patrimonio. Los recursos de la empresa (Activo) se financian con deudas (Pasivo) o capital propio (Patrimonio)."}'::jsonb
FROM niveles WHERE orden = 2;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 2, 'opcion_multiple', 1,
  '{"pregunta":"Una empresa tiene activos por $500.000 y pasivos por $200.000. ¿Cuánto es su Patrimonio?","opciones":["$300.000","$700.000","$200.000","$500.000"],"respuesta_correcta":"$300.000","explicacion_error":"Patrimonio = Activo − Pasivo = $500.000 − $200.000 = $300.000. Verificación: $500.000 = $200.000 + $300.000 ✓"}'::jsonb
FROM niveles WHERE orden = 2;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 3, 'verdadero_falso', 1,
  '{"pregunta":"La ecuación contable siempre debe mantenerse en equilibrio, sin importar cuántas transacciones ocurran.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion_error":"Correcto. Cada transacción afecta la ecuación de forma equilibrada: si un lado sube o baja, el otro también lo hace por el mismo valor."}'::jsonb
FROM niveles WHERE orden = 2;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 4, 'opcion_multiple', 1,
  '{"pregunta":"En la ecuación contable, ¿qué representa el PASIVO?","opciones":["Las deudas con bancos y proveedores que financian los activos","Los recursos propios aportados por los dueños","El valor total de los bienes de la empresa","Los ingresos del período contable"],"respuesta_correcta":"Las deudas con bancos y proveedores que financian los activos","explicacion_error":"El Pasivo son las fuentes externas de financiación (bancos, proveedores). Junto con el Patrimonio, financia los Activos de la empresa."}'::jsonb
FROM niveles WHERE orden = 2;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 5, 'opcion_multiple', 1,
  '{"pregunta":"Si una empresa recibe un préstamo bancario de $50.000, ¿qué ocurre con la ecuación?","opciones":["El Activo (caja) y el Pasivo (préstamo) aumentan $50.000 cada uno","Solo el Activo aumenta en $50.000","Solo el Pasivo aumenta en $50.000","El Patrimonio aumenta en $50.000"],"respuesta_correcta":"El Activo (caja) y el Pasivo (préstamo) aumentan $50.000 cada uno","explicacion_error":"Al recibir el préstamo entra efectivo (Activo +$50.000) y nace una deuda (Pasivo +$50.000). Ambos lados aumentan igual y la ecuación se mantiene."}'::jsonb
FROM niveles WHERE orden = 2;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 6, 'verdadero_falso', 1,
  '{"pregunta":"Si los activos de una empresa son $800.000 y su patrimonio es $350.000, entonces sus pasivos son $450.000.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion_error":"Pasivo = Activo − Patrimonio = $800.000 − $350.000 = $450.000. Verificación: $800.000 = $450.000 + $350.000 ✓"}'::jsonb
FROM niveles WHERE orden = 2;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 7, 'opcion_multiple', 1,
  '{"pregunta":"Un socio aporta $100.000 en efectivo a la empresa. ¿Cómo afecta esto la ecuación?","opciones":["El Activo (caja) y el Patrimonio aumentan $100.000","Solo el Activo aumenta","Solo el Patrimonio aumenta","El Pasivo aumenta $100.000"],"respuesta_correcta":"El Activo (caja) y el Patrimonio aumentan $100.000","explicacion_error":"El aporte de un socio es fuente interna: aumenta el Activo (entra efectivo) y el Patrimonio (mayor capital del dueño) por igual."}'::jsonb
FROM niveles WHERE orden = 2;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 8, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué representa el PATRIMONIO en la ecuación contable?","opciones":["La participación de los propietarios en la empresa","Las deudas con proveedores y bancos","El efectivo disponible en caja","Los ingresos acumulados del año"],"respuesta_correcta":"La participación de los propietarios en la empresa","explicacion_error":"El Patrimonio es la fuente interna de financiación: lo que los propietarios han aportado más las utilidades acumuladas. Patrimonio = Activo − Pasivo."}'::jsonb
FROM niveles WHERE orden = 2;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 9, 'opcion_multiple', 1,
  '{"pregunta":"Una empresa paga una deuda de $30.000 con efectivo. ¿Qué pasa con la ecuación?","opciones":["Activo (caja) y Pasivo (deuda) disminuyen $30.000 cada uno","Solo el Activo disminuye","El Patrimonio disminuye $30.000","La ecuación se desequilibra"],"respuesta_correcta":"Activo (caja) y Pasivo (deuda) disminuyen $30.000 cada uno","explicacion_error":"Pagar una deuda con efectivo reduce el Activo (caja −$30.000) y el Pasivo (deuda −$30.000) por igual. La ecuación sigue en equilibrio."}'::jsonb
FROM niveles WHERE orden = 2;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 10, 'opcion_multiple', 1,
  '{"pregunta":"Si Activo = $1.200.000 y Pasivo = $750.000, ¿cuánto es el Patrimonio?","opciones":["$450.000","$1.950.000","$750.000","$1.200.000"],"respuesta_correcta":"$450.000","explicacion_error":"Patrimonio = Activo − Pasivo = $1.200.000 − $750.000 = $450.000. Verificación: $1.200.000 = $750.000 + $450.000 ✓"}'::jsonb
FROM niveles WHERE orden = 2;
