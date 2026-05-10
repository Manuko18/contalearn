-- ══════════════════════════════════════════════════════════════════
--  ContaLearn — Contenido Niveles 3, 4 y 5
--  Ejecutar en: Supabase → SQL Editor
--
--  Nivel 3: Débitos y Créditos
--  Nivel 4: Estados Financieros
--  Nivel 5: NIC/NIIF Avanzado
--
--  Los niveles ya existen en la BD. Este script:
--  1) Actualiza teoria_json de cada nivel (por orden)
--  2) Inserta las lecciones usando el id real del nivel
-- ══════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════
--  NIVEL 3 — Débitos y Créditos
-- ══════════════════════════════════════════════════════════════════

-- Teoría (5 slides)
UPDATE niveles
SET teoria_json = '[
  {
    "titulo": "La Partida Doble",
    "contenido": "Todo hecho económico afecta al menos dos cuentas: una se debita y otra se acredita. La suma de débitos siempre debe ser igual a la suma de créditos. Este principio, llamado partida doble, garantiza que la ecuación contable siempre esté en equilibrio."
  },
  {
    "titulo": "Débito y Crédito",
    "contenido": "Debitar una cuenta significa registrar un valor en el lado izquierdo (Debe). Acreditar significa registrar en el lado derecho (Haber). Dependiendo de la naturaleza de la cuenta, un débito puede aumentarla o disminuirla."
  },
  {
    "titulo": "Naturaleza de las Cuentas",
    "contenido": "Las cuentas de Activo y Gastos tienen naturaleza deudora: aumentan con débitos y disminuyen con créditos. Las cuentas de Pasivo, Patrimonio e Ingresos tienen naturaleza acreedora: aumentan con créditos y disminuyen con débitos."
  },
  {
    "titulo": "El Plan de Cuentas",
    "contenido": "El plan de cuentas es el catálogo ordenado de todas las cuentas que usa una empresa. Se organiza en clases: 1 Activos, 2 Pasivos, 3 Patrimonio, 4 Ingresos, 5 Gastos, 6 Costos. Cada cuenta tiene un código numérico único."
  },
  {
    "titulo": "Asientos Contables",
    "contenido": "Un asiento contable es el registro de una transacción en el libro diario. Muestra la fecha, las cuentas afectadas y los valores en Debe y Haber. Ejemplo: compra de mercancía al contado — se debita Inventario y se acredita Caja."
  }
]'
WHERE orden = 3;

-- Lecciones Nivel 3 (limpiamos primero para evitar conflictos)
DELETE FROM progreso_usuario WHERE leccion_id IN (SELECT id FROM lecciones WHERE nivel_id = (SELECT id FROM niveles WHERE orden = 3));
DELETE FROM lecciones WHERE nivel_id = (SELECT id FROM niveles WHERE orden = 3);

WITH n3 AS (SELECT id FROM niveles WHERE orden = 3)

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT n3.id, lec.orden, lec.tipo_ejercicio, lec.dificultad, lec.contenido_json
FROM n3, (VALUES

  -- ── JUNIOR (dificultad 1) ─────────────────────────────────────
  (1, 'multiple_choice', 1,
   '{"pregunta":"¿Qué significa debitar una cuenta?","opciones":["Registrar un valor en el lado izquierdo (Debe)","Registrar un valor en el lado derecho (Haber)","Aumentar el saldo de cualquier cuenta","Cerrar la cuenta al final del período"],"respuesta_correcta":"Registrar un valor en el lado izquierdo (Debe)","explicacion":"Debitar = registrar en el Debe (lado izquierdo del T-account). Acreditar = registrar en el Haber (lado derecho)."}'::jsonb),

  (2, 'verdadero_falso', 1,
   '{"pregunta":"En la partida doble, la suma de los débitos siempre debe ser igual a la suma de los créditos.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"Este es el principio fundamental de la contabilidad por partida doble: débitos = créditos en cada asiento."}'::jsonb),

  (3, 'multiple_choice', 1,
   '{"pregunta":"¿Cuál es la naturaleza de las cuentas de Activo?","opciones":["Deudora (aumentan con débitos)","Acreedora (aumentan con créditos)","Neutral","Depende del tipo de activo"],"respuesta_correcta":"Deudora (aumentan con débitos)","explicacion":"Los activos aumentan con débitos y disminuyen con créditos. Por eso decimos que tienen naturaleza deudora."}'::jsonb),

  (4, 'verdadero_falso', 1,
   '{"pregunta":"Las cuentas de Pasivo aumentan cuando se acreditan (se registra en el Haber).","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"Pasivo, Patrimonio e Ingresos tienen naturaleza acreedora: aumentan con créditos y disminuyen con débitos."}'::jsonb),

  (5, 'multiple_choice', 1,
   '{"pregunta":"En el plan de cuentas colombiano, ¿a qué clase pertenecen los Ingresos?","opciones":["Clase 4","Clase 1","Clase 5","Clase 3"],"respuesta_correcta":"Clase 4","explicacion":"En el PUC (Plan Único de Cuentas): 1=Activos, 2=Pasivos, 3=Patrimonio, 4=Ingresos, 5=Gastos, 6=Costos de Ventas."}'::jsonb),

  (6, 'multiple_choice', 1,
   '{"pregunta":"Al comprar un equipo de cómputo pagando en efectivo, ¿qué cuenta se DEBITA?","opciones":["Equipo de cómputo (Activo)","Caja (Activo)","Proveedores (Pasivo)","Capital (Patrimonio)"],"respuesta_correcta":"Equipo de cómputo (Activo)","explicacion":"Se debita el activo adquirido (Equipo de cómputo) y se acredita la cuenta que entrega el valor (Caja)."}'::jsonb),

  -- ── SEMI-JUNIOR (dificultad 2) ────────────────────────────────
  (7, 'multiple_choice', 2,
   '{"pregunta":"Una empresa paga $500 de arriendo. ¿Cuál es el asiento correcto?","opciones":["Débito Gasto Arriendo / Crédito Caja","Crédito Gasto Arriendo / Débito Caja","Débito Caja / Crédito Gasto Arriendo","Débito Pasivo / Crédito Gasto"],"respuesta_correcta":"Débito Gasto Arriendo / Crédito Caja","explicacion":"Los gastos tienen naturaleza deudora, así que se debitan cuando aumentan. La caja disminuye, entonces se acredita."}'::jsonb),

  (8, 'multiple_choice', 2,
   '{"pregunta":"Se venden mercancías a crédito por $2.000. ¿Qué cuentas se afectan?","opciones":["Débito Cuentas por Cobrar / Crédito Ingresos","Débito Ingresos / Crédito Cuentas por Cobrar","Débito Caja / Crédito Ingresos","Débito Cuentas por Pagar / Crédito Ingresos"],"respuesta_correcta":"Débito Cuentas por Cobrar / Crédito Ingresos","explicacion":"La venta genera un derecho de cobro (activo = débito) y un ingreso (naturaleza acreedora = crédito)."}'::jsonb),

  (9, 'verdadero_falso', 2,
   '{"pregunta":"El saldo normal de la cuenta Cuentas por Pagar es un saldo ACREEDOR.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"Cuentas por Pagar es un Pasivo (naturaleza acreedora), por lo tanto su saldo normal es acreedor."}'::jsonb),

  (10, 'multiple_choice', 2,
   '{"pregunta":"¿Cuál de las siguientes cuentas normalmente tiene saldo DEUDOR?","opciones":["Inventario de Mercancías","Préstamos por Pagar","Capital Social","Ingresos por Servicios"],"respuesta_correcta":"Inventario de Mercancías","explicacion":"Inventario es un Activo (naturaleza deudora). Las otras tres son Pasivo, Patrimonio e Ingreso — todas acreedoras."}'::jsonb),

  (11, 'completar_espacio', 2,
   '{"pregunta":"Al comprar mercancías a crédito, se debita Inventario y se acredita _____.","respuesta_correcta":"Cuentas por Pagar","explicacion":"La compra a crédito genera una obligación con el proveedor, que se registra en Cuentas por Pagar (Pasivo)."}'::jsonb),

  -- ── SEMI-SENIOR (dificultad 3) ────────────────────────────────
  (12, 'multiple_choice', 3,
   '{"pregunta":"¿Cuál es el asiento correcto para registrar la depreciación mensual de un activo?","opciones":["Débito Gasto Depreciación / Crédito Depreciación Acumulada","Débito Depreciación Acumulada / Crédito Activo Fijo","Débito Activo Fijo / Crédito Gasto Depreciación","Débito Pasivo / Crédito Gasto Depreciación"],"respuesta_correcta":"Débito Gasto Depreciación / Crédito Depreciación Acumulada","explicacion":"La Depreciación Acumulada es una cuenta de Activo de naturaleza acreedora (contra-activo) que reduce el valor en libros."}'::jsonb),

  (13, 'verdadero_falso', 3,
   '{"pregunta":"La Depreciación Acumulada es una cuenta de naturaleza ACREEDORA que reduce el valor del activo.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"Las cuentas contra-activo (como Depreciación Acumulada y Provisión para deudas malas) son acreedoras y restan al activo bruto."}'::jsonb),

  (14, 'multiple_choice', 3,
   '{"pregunta":"Se cobra a un cliente $1.200 de los cuales $1.000 ya estaban en Cuentas por Cobrar. ¿Qué ocurre con las cuentas?","opciones":["Débito Caja $1.200 / Crédito CxC $1.000 / Crédito Ingreso $200","Débito Caja $1.200 / Crédito Ingreso $1.200","Débito CxC $1.000 / Débito Ingreso $200 / Crédito Caja $1.200","Débito Caja $1.200 / Crédito CxC $1.200"],"respuesta_correcta":"Débito Caja $1.200 / Crédito CxC $1.000 / Crédito Ingreso $200","explicacion":"Se recibe $1.200 en caja. Se cancela la deuda existente de $1.000 y se reconoce el ingreso adicional de $200."}'::jsonb),

  (15, 'multiple_choice', 3,
   '{"pregunta":"Si el Activo aumenta en $5.000 y el Pasivo aumenta en $5.000, ¿qué sucede con el Patrimonio?","opciones":["Permanece igual","Aumenta $5.000","Disminuye $5.000","No se puede determinar"],"respuesta_correcta":"Permanece igual","explicacion":"Activo = Pasivo + Patrimonio. Si activo +5.000 y pasivo +5.000, el patrimonio no cambia para mantener el equilibrio."}'::jsonb),

  (16, 'completar_espacio', 3,
   '{"pregunta":"La cuenta ''Ingresos por Servicios'' tiene naturaleza _____ y aumenta cuando se _____.","respuesta_correcta":"acreedora, acredita","explicacion":"Los Ingresos son de naturaleza acreedora (clase 4 del PUC). Aumentan cuando se acreditan (Haber) y disminuyen cuando se debitan."}'::jsonb),

  -- ── SENIOR (dificultad 4) ─────────────────────────────────────
  (17, 'multiple_choice', 4,
   '{"pregunta":"Una empresa vende mercancías por $10.000 + IVA 19%. El costo de la mercancía es $6.000. ¿Cuántas cuentas afecta este asiento?","opciones":["4 cuentas","2 cuentas","3 cuentas","5 cuentas"],"respuesta_correcta":"4 cuentas","explicacion":"Débito: CxC $11.900 / Crédito: Ingresos $10.000 + IVA por Pagar $1.900. Además: Débito Costo de Ventas $6.000 / Crédito Inventario $6.000."}'::jsonb),

  (18, 'multiple_choice', 4,
   '{"pregunta":"Una deuda de largo plazo vence en los próximos 12 meses. ¿Cómo debe clasificarse en el balance?","opciones":["Pasa a Pasivo Corriente","Permanece en Pasivo No Corriente","Se lleva a Patrimonio","Se elimina del balance"],"respuesta_correcta":"Pasa a Pasivo Corriente","explicacion":"Según las NIC, las obligaciones exigibles dentro de los 12 meses siguientes deben clasificarse como pasivo corriente."}'::jsonb),

  (19, 'verdadero_falso', 4,
   '{"pregunta":"Un error de omisión ocurre cuando una transacción no se registra en absoluto. Este error NO altera la igualdad débitos = créditos.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"Si no se registra ninguna parte del asiento, la igualdad se mantiene (ambos lados están en cero). Pero el balance estará incompleto."}'::jsonb),

  (20, 'multiple_choice', 4,
   '{"pregunta":"¿Cuál es el propósito principal del Balance de Prueba (balanza de comprobación)?","opciones":["Verificar que el total de débitos iguala al total de créditos","Calcular la utilidad del período","Determinar el patrimonio neto","Proyectar el flujo de caja futuro"],"respuesta_correcta":"Verificar que el total de débitos iguala al total de créditos","explicacion":"El balance de prueba verifica la aritmética del libro mayor pero NO detecta errores de principio o compensados."}'::jsonb),

  (21, 'completar_espacio', 4,
   '{"pregunta":"Al final del período se deben registrar gastos incurridos pero no pagados. Este tipo de ajuste se llama ajuste por _____.","respuesta_correcta":"acumulación","explicacion":"Los ajustes por acumulación (o devengamiento) reconocen gastos e ingresos en el período en que ocurren, no cuando se pagan o cobran."}'::jsonb)

) AS lec(orden, tipo_ejercicio, dificultad, contenido_json)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════
--  NIVEL 4 — Estados Financieros
-- ══════════════════════════════════════════════════════════════════

UPDATE niveles
SET teoria_json = '[
  {
    "titulo": "El Balance General",
    "contenido": "El Balance General (o Estado de Situación Financiera) muestra los Activos, Pasivos y Patrimonio de una empresa en una fecha específica. Responde la pregunta: ¿cuánto tiene la empresa y cómo se financia? La ecuación fundamental es: Activo = Pasivo + Patrimonio."
  },
  {
    "titulo": "Estado de Resultados",
    "contenido": "El Estado de Resultados muestra los Ingresos, Costos y Gastos durante un período. Determina la Utilidad Neta o Pérdida. Su estructura básica es: Ingresos - Costo de Ventas = Utilidad Bruta. Luego: Utilidad Bruta - Gastos Operacionales = Utilidad Operacional."
  },
  {
    "titulo": "Estado de Flujo de Efectivo",
    "contenido": "Este estado muestra las entradas y salidas reales de dinero. Se divide en tres actividades: Operación (del negocio principal), Inversión (compra y venta de activos de largo plazo) y Financiación (préstamos y capital). Una empresa puede ser rentable y aun así tener problemas de liquidez."
  },
  {
    "titulo": "Estado de Cambios en el Patrimonio",
    "contenido": "Explica cómo varió el patrimonio de los socios durante el período. Incluye el capital aportado, las utilidades o pérdidas del ejercicio, los dividendos distribuidos y otras variaciones como la revalorización de activos."
  },
  {
    "titulo": "Análisis Financiero Básico",
    "contenido": "Los estados financieros se analizan mediante indicadores. La Razón Corriente (Activo Corriente ÷ Pasivo Corriente) mide liquidez. El Nivel de Endeudamiento (Pasivo Total ÷ Activo Total) mide riesgo. La Rentabilidad del Patrimonio (Utilidad Neta ÷ Patrimonio) mide retorno."
  }
]'
WHERE orden = 4;

-- Lecciones Nivel 4 (limpiamos primero para evitar conflictos)
DELETE FROM progreso_usuario WHERE leccion_id IN (SELECT id FROM lecciones WHERE nivel_id = (SELECT id FROM niveles WHERE orden = 4));
DELETE FROM lecciones WHERE nivel_id = (SELECT id FROM niveles WHERE orden = 4);

WITH n4 AS (SELECT id FROM niveles WHERE orden = 4)

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT n4.id, lec.orden, lec.tipo_ejercicio, lec.dificultad, lec.contenido_json
FROM n4, (VALUES

  -- ── JUNIOR (dificultad 1) ─────────────────────────────────────
  (1, 'multiple_choice', 1,
   '{"pregunta":"¿Cuál es la ecuación fundamental del Balance General?","opciones":["Activo = Pasivo + Patrimonio","Ingresos - Gastos = Utilidad","Activo - Pasivo = Ingresos","Patrimonio = Activo + Pasivo"],"respuesta_correcta":"Activo = Pasivo + Patrimonio","explicacion":"La ecuación contable básica es Activo = Pasivo + Patrimonio. Todo lo que tiene la empresa (activos) está financiado por deudas (pasivos) o recursos propios (patrimonio)."}'::jsonb),

  (2, 'verdadero_falso', 1,
   '{"pregunta":"El Estado de Resultados muestra la situación financiera de la empresa en una fecha específica.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Falso","explicacion":"El Estado de Resultados muestra los Ingresos y Gastos durante un PERÍODO de tiempo (no una fecha). El Balance General sí muestra la situación en una fecha específica."}'::jsonb),

  (3, 'multiple_choice', 1,
   '{"pregunta":"¿Cuál de estos es un Activo NO Corriente?","opciones":["Edificio propio","Inventario de mercancías","Cuentas por cobrar a 30 días","Efectivo en caja"],"respuesta_correcta":"Edificio propio","explicacion":"Los activos no corrientes son de largo plazo (más de 1 año). El edificio no se convierte en efectivo en el corto plazo. Los otros tres son activos corrientes."}'::jsonb),

  (4, 'multiple_choice', 1,
   '{"pregunta":"Si los Ingresos son $50.000 y el Costo de Ventas es $30.000, ¿cuál es la Utilidad Bruta?","opciones":["$20.000","$80.000","$30.000","$50.000"],"respuesta_correcta":"$20.000","explicacion":"Utilidad Bruta = Ingresos - Costo de Ventas = $50.000 - $30.000 = $20.000."}'::jsonb),

  (5, 'verdadero_falso', 1,
   '{"pregunta":"El cobro de dinero a clientes por ventas realizadas es una actividad de OPERACIÓN en el Flujo de Efectivo.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"Las actividades de operación incluyen cobros a clientes, pagos a proveedores y pagos de nómina — todo relacionado con el giro principal del negocio."}'::jsonb),

  (6, 'multiple_choice', 1,
   '{"pregunta":"¿Cuál de los siguientes forma parte del Patrimonio?","opciones":["Utilidades Retenidas","Préstamo Bancario","Cuentas por Pagar","Inventario"],"respuesta_correcta":"Utilidades Retenidas","explicacion":"El Patrimonio incluye: Capital Suscrito, Prima en colocación de acciones, Reservas y Utilidades Retenidas. Los otros son Pasivo y Activo."}'::jsonb),

  -- ── SEMI-JUNIOR (dificultad 2) ────────────────────────────────
  (7, 'multiple_choice', 2,
   '{"pregunta":"El Activo Corriente es $80.000 y el Pasivo Corriente es $40.000. ¿Cuál es la Razón Corriente?","opciones":["2,0","0,5","1,0","40.000"],"respuesta_correcta":"2,0","explicacion":"Razón Corriente = Activo Corriente ÷ Pasivo Corriente = 80.000 ÷ 40.000 = 2,0. Significa que por cada $1 de deuda corriente, hay $2 de activos corrientes."}'::jsonb),

  (8, 'verdadero_falso', 2,
   '{"pregunta":"La compra de una máquina industrial es una actividad de INVERSIÓN en el Estado de Flujo de Efectivo.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"Las actividades de inversión incluyen la compra y venta de activos de largo plazo como maquinaria, equipos e inversiones en otras empresas."}'::jsonb),

  (9, 'multiple_choice', 2,
   '{"pregunta":"Utilidad Bruta $20.000 / Gastos Operacionales $8.000 / Impuestos $3.000. ¿Cuál es la Utilidad Neta?","opciones":["$9.000","$12.000","$17.000","$20.000"],"respuesta_correcta":"$9.000","explicacion":"Utilidad Operacional = 20.000 - 8.000 = 12.000. Utilidad Neta = 12.000 - 3.000 = $9.000."}'::jsonb),

  (10, 'verdadero_falso', 2,
   '{"pregunta":"Una empresa puede ser rentable (con utilidades) y al mismo tiempo tener problemas de liquidez (sin efectivo).","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"Si una empresa vende a crédito, puede registrar ingresos y utilidades sin recibir efectivo. El flujo de caja y la rentabilidad son conceptos distintos."}'::jsonb),

  (11, 'completar_espacio', 2,
   '{"pregunta":"El estado financiero que muestra los Activos, Pasivos y Patrimonio en una fecha determinada se llama Estado de _____ Financiera.","respuesta_correcta":"Situación","explicacion":"Según las NIIF, el Balance General se denomina oficialmente Estado de Situación Financiera. También se acepta Balance General en la práctica local."}'::jsonb),

  -- ── SEMI-SENIOR (dificultad 3) ────────────────────────────────
  (12, 'multiple_choice', 3,
   '{"pregunta":"Activo Total $500.000 / Pasivo Total $200.000. ¿Cuál es el nivel de endeudamiento?","opciones":["40%","60%","25%","50%"],"respuesta_correcta":"40%","explicacion":"Nivel de Endeudamiento = Pasivo Total ÷ Activo Total = 200.000 ÷ 500.000 = 0,40 = 40%."}'::jsonb),

  (13, 'multiple_choice', 3,
   '{"pregunta":"¿Qué mide el EBITDA?","opciones":["Utilidad antes de intereses, impuestos, depreciación y amortización","Utilidad Neta después de impuestos","Flujo de caja de actividades de inversión","Total de activos menos pasivos"],"respuesta_correcta":"Utilidad antes de intereses, impuestos, depreciación y amortización","explicacion":"EBITDA (Earnings Before Interest, Taxes, Depreciation and Amortization) mide la rentabilidad operativa eliminando efectos financieros y contables."}'::jsonb),

  (14, 'verdadero_falso', 3,
   '{"pregunta":"En el método INDIRECTO del Flujo de Efectivo, se parte de la Utilidad Neta y se ajusta por partidas no monetarias como depreciación.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"El método indirecto concilia la utilidad con el efectivo neto. La depreciación se suma porque es un gasto que no implica salida de efectivo."}'::jsonb),

  (15, 'multiple_choice', 3,
   '{"pregunta":"En el análisis vertical del Estado de Resultados, ¿cuál es la base (100%) que se usa comúnmente?","opciones":["Ingresos Operacionales","Activo Total","Patrimonio","Utilidad Bruta"],"respuesta_correcta":"Ingresos Operacionales","explicacion":"En el análisis vertical del Estado de Resultados, los Ingresos Operacionales representan el 100% y cada partida se expresa como porcentaje de estos."}'::jsonb),

  (16, 'completar_espacio', 3,
   '{"pregunta":"El ROE (Rentabilidad del Patrimonio) se calcula como Utilidad Neta ÷ _____.","respuesta_correcta":"Patrimonio","explicacion":"ROE = Utilidad Neta ÷ Patrimonio. Mide cuánto retorno generan los recursos aportados por los socios. Un ROE del 15% significa $0.15 de utilidad por cada $1 de patrimonio."}'::jsonb),

  -- ── SENIOR (dificultad 4) ─────────────────────────────────────
  (17, 'multiple_choice', 4,
   '{"pregunta":"Una empresa emite $50.000 en bonos a 5 años. ¿Cómo afecta esto los estados financieros?","opciones":["Aumenta Activo (Caja) y Pasivo No Corriente (Bonos por Pagar)","Aumenta Activo y Patrimonio","Disminuye Pasivo y aumenta Patrimonio","Solo afecta el Estado de Resultados"],"respuesta_correcta":"Aumenta Activo (Caja) y Pasivo No Corriente (Bonos por Pagar)","explicacion":"Recibir dinero de bonos aumenta el efectivo (activo corriente) y crea una obligación de largo plazo (pasivo no corriente)."}'::jsonb),

  (18, 'multiple_choice', 4,
   '{"pregunta":"Activo Corriente $100.000 / Inventarios $30.000 / Pasivo Corriente $50.000. ¿Cuál es la Prueba Ácida?","opciones":["1,4","2,0","0,6","3,3"],"respuesta_correcta":"1,4","explicacion":"Prueba Ácida = (Activo Corriente - Inventarios) ÷ Pasivo Corriente = (100.000 - 30.000) ÷ 50.000 = 70.000 ÷ 50.000 = 1,4."}'::jsonb),

  (19, 'verdadero_falso', 4,
   '{"pregunta":"Según las NIIF, los estados financieros deben presentarse como mínimo con comparativos del período anterior.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"NIC 1 exige que los EF incluyan al menos dos períodos comparativos para facilitar la evaluación de tendencias."}'::jsonb),

  (20, 'multiple_choice', 4,
   '{"pregunta":"¿Cuál es la fórmula del Capital de Trabajo Neto?","opciones":["Activo Corriente - Pasivo Corriente","Activo Total - Pasivo Total","Patrimonio - Activo Fijo","Ingresos - Gastos Operacionales"],"respuesta_correcta":"Activo Corriente - Pasivo Corriente","explicacion":"El Capital de Trabajo Neto mide los recursos disponibles para operar en el corto plazo. Un CTN positivo indica capacidad para cubrir las deudas corrientes."}'::jsonb),

  (21, 'completar_espacio', 4,
   '{"pregunta":"Cuando una empresa controla más del 50% de los votos de otra, debe presentar estados financieros _____.","respuesta_correcta":"consolidados","explicacion":"Los estados financieros consolidados combinan los EF de la empresa matriz y sus subsidiarias como si fueran una sola entidad económica."}'::jsonb)

) AS lec(orden, tipo_ejercicio, dificultad, contenido_json)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════
--  NIVEL 5 — NIC/NIIF Avanzado
-- ══════════════════════════════════════════════════════════════════

UPDATE niveles
SET teoria_json = '[
  {
    "titulo": "NIIF 15 — Reconocimiento de Ingresos",
    "contenido": "La NIIF 15 establece un modelo de cinco pasos para reconocer ingresos: 1) Identificar el contrato con el cliente. 2) Identificar las obligaciones de desempeño. 3) Determinar el precio de la transacción. 4) Asignar el precio a las obligaciones. 5) Reconocer el ingreso cuando se satisface la obligación."
  },
  {
    "titulo": "NIIF 16 — Arrendamientos",
    "contenido": "La NIIF 16 exige que los arrendatarios reconozcan en el balance un Activo por Derecho de Uso y un Pasivo por Arrendamiento para casi todos los contratos de arrendamiento. Esto aumenta los activos y pasivos reportados, afectando indicadores como el nivel de endeudamiento."
  },
  {
    "titulo": "NIC 36 — Deterioro de Activos",
    "contenido": "Cuando el valor recuperable de un activo es inferior a su valor en libros, existe deterioro. El valor recuperable es el mayor entre el Valor en Uso (flujos futuros descontados) y el Valor Razonable menos costos de venta. El deterioro se registra como un gasto."
  },
  {
    "titulo": "NIC 37 — Provisiones y Contingencias",
    "contenido": "Una Provisión se reconoce cuando: existe una obligación presente (legal o implícita), es probable que se requiera una salida de recursos y el importe puede estimarse. Las Contingencias son posibles obligaciones que dependen de eventos futuros — si son probables se provisionan; si son posibles solo se revelan."
  },
  {
    "titulo": "NIIF 9 — Instrumentos Financieros",
    "contenido": "La NIIF 9 clasifica los activos financieros según el modelo de negocio y las características del flujo de efectivo. Las categorías son: Costo Amortizado, Valor Razonable con cambios en Otro Resultado Integral (VRORI), y Valor Razonable con cambios en Resultados (VRR). También incluye el modelo de pérdida crediticia esperada."
  }
]'
WHERE orden = 5;

-- Lecciones Nivel 5 (limpiamos primero para evitar conflictos)
DELETE FROM progreso_usuario WHERE leccion_id IN (SELECT id FROM lecciones WHERE nivel_id = (SELECT id FROM niveles WHERE orden = 5));
DELETE FROM lecciones WHERE nivel_id = (SELECT id FROM niveles WHERE orden = 5);

WITH n5 AS (SELECT id FROM niveles WHERE orden = 5)

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT n5.id, lec.orden, lec.tipo_ejercicio, lec.dificultad, lec.contenido_json
FROM n5, (VALUES

  -- ── JUNIOR (dificultad 1) ─────────────────────────────────────
  (1, 'multiple_choice', 1,
   '{"pregunta":"¿Cuántos pasos tiene el modelo de reconocimiento de ingresos de la NIIF 15?","opciones":["5 pasos","3 pasos","7 pasos","4 pasos"],"respuesta_correcta":"5 pasos","explicacion":"NIIF 15 usa un modelo de 5 pasos: identificar el contrato, identificar obligaciones, determinar precio, asignar precio y reconocer ingreso al satisfacer la obligación."}'::jsonb),

  (2, 'verdadero_falso', 1,
   '{"pregunta":"La NIIF 16 exige que los arrendatarios registren un Activo por Derecho de Uso en el balance.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"La NIIF 16 eliminó la distinción arrendamiento operativo vs financiero para arrendatarios. Casi todos los arrendamientos generan un activo y un pasivo en el balance."}'::jsonb),

  (3, 'multiple_choice', 1,
   '{"pregunta":"Según la NIC 36, hay deterioro de un activo cuando:","opciones":["Su valor en libros supera su valor recuperable","Su valor recuperable supera su costo histórico","Tiene más de 5 años de uso","Ha sido revaluado"],"respuesta_correcta":"Su valor en libros supera su valor recuperable","explicacion":"El deterioro ocurre cuando el activo no podrá recuperarse a través de su uso o venta. Se debe rebajar el valor en libros al valor recuperable."}'::jsonb),

  (4, 'verdadero_falso', 1,
   '{"pregunta":"Según la NIC 37, se debe reconocer una provisión solo cuando la salida de recursos sea POSIBLE (no necesariamente probable).","opciones":["Verdadero","Falso"],"respuesta_correcta":"Falso","explicacion":"Para reconocer una provisión se requiere que la salida de recursos sea PROBABLE (no solo posible). Si es posible pero no probable, solo se revela en notas."}'::jsonb),

  (5, 'multiple_choice', 1,
   '{"pregunta":"¿Cuántas categorías de clasificación de activos financieros establece la NIIF 9?","opciones":["3 categorías","5 categorías","2 categorías","4 categorías"],"respuesta_correcta":"3 categorías","explicacion":"NIIF 9 tiene 3 categorías: Costo Amortizado, Valor Razonable con cambios en ORI (VRORI), y Valor Razonable con cambios en Resultados (VRR)."}'::jsonb),

  (6, 'multiple_choice', 1,
   '{"pregunta":"¿Qué asume la hipótesis de negocio en marcha (going concern)?","opciones":["La empresa continuará operando en el futuro previsible","La empresa cerrará en el siguiente año","Los activos se valúan al precio de liquidación","Los estados financieros se preparan mensualmente"],"respuesta_correcta":"La empresa continuará operando en el futuro previsible","explicacion":"El going concern es una suposición fundamental: si existen dudas sobre la continuidad, deben revelarse en los EF y puede cambiar la base de preparación."}'::jsonb),

  -- ── SEMI-JUNIOR (dificultad 2) ────────────────────────────────
  (7, 'multiple_choice', 2,
   '{"pregunta":"Una empresa de construcción recibe $300.000 por un contrato de 3 años. Según NIIF 15, ¿cuándo reconoce el ingreso?","opciones":["A medida que se satisfacen las obligaciones de desempeño","Al firmar el contrato","Al final del año 3","Al cobrar cada cuota"],"respuesta_correcta":"A medida que se satisfacen las obligaciones de desempeño","explicacion":"NIIF 15 reconoce ingresos cuando (o conforme) se satisface la obligación de desempeño, no necesariamente cuando se factura o cobra."}'::jsonb),

  (8, 'multiple_choice', 2,
   '{"pregunta":"¿Cuál es el Valor Recuperable de un activo según la NIC 36?","opciones":["El mayor entre: valor razonable menos costos de venta, y valor en uso","El menor entre: costo histórico y valor de mercado","El valor razonable únicamente","El costo de reposición"],"respuesta_correcta":"El mayor entre: valor razonable menos costos de venta, y valor en uso","explicacion":"Valor Recuperable = MAX(Valor Razonable - Costos de Venta, Valor en Uso). Se toma el mayor porque representa lo que mejor puede recuperar la entidad."}'::jsonb),

  (9, 'verdadero_falso', 2,
   '{"pregunta":"La adopción de la NIIF 16 generalmente AUMENTA el nivel de endeudamiento (pasivo/activo) de las empresas arrendatarias.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"Al reconocer el pasivo por arrendamiento en el balance, aumenta el pasivo total, lo que eleva el nivel de endeudamiento calculado."}'::jsonb),

  (10, 'multiple_choice', 2,
   '{"pregunta":"Una empresa tiene una demanda en su contra cuya probabilidad de pérdida se estima en 25%. ¿Cómo debe tratarse?","opciones":["Revelar en notas como contingencia posible","Reconocer una provisión en el balance","Ignorar el evento","Registrar como pasivo cierto"],"respuesta_correcta":"Revelar en notas como contingencia posible","explicacion":"Probabilidad 25% = posible pero no probable (<50%). No se provisionan, solo se revelan en notas a los estados financieros."}'::jsonb),

  (11, 'completar_espacio', 2,
   '{"pregunta":"La NIIF 9 reemplazó el modelo de pérdida incurrida por el modelo de pérdida crediticia _____.","respuesta_correcta":"esperada","explicacion":"El modelo de Pérdida Crediticia Esperada (PCE) requiere reconocer pérdidas de manera anticipada, sin esperar a que el incumplimiento ocurra."}'::jsonb),

  -- ── SEMI-SENIOR (dificultad 3) ────────────────────────────────
  (12, 'multiple_choice', 3,
   '{"pregunta":"Una empresa vende productos con descuentos por volumen variables. Según NIIF 15, ¿cómo debe estimarse el precio de transacción?","opciones":["Usando el valor esperado o el importe más probable, según el caso","Usando siempre el precio máximo posible","Usando siempre el precio mínimo","No se reconoce el ingreso hasta que el descuento sea definitivo"],"respuesta_correcta":"Usando el valor esperado o el importe más probable, según el caso","explicacion":"NIIF 15 permite dos métodos para la contraprestación variable: valor esperado (promedio ponderado) o importe más probable. Se elige el que mejor predice el ingreso."}'::jsonb),

  (13, 'verdadero_falso', 3,
   '{"pregunta":"Según la NIC 36, el deterioro de la Plusvalía (Goodwill) puede revertirse en períodos posteriores si el valor recuperable aumenta.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Falso","explicacion":"El deterioro de la Plusvalía NO puede revertirse. Para otros activos sí está permitida la reversión, pero limitada al costo amortizado que hubiera tenido sin deterioro."}'::jsonb),

  (14, 'multiple_choice', 3,
   '{"pregunta":"¿Cuándo surge un Pasivo por Impuesto Diferido?","opciones":["Cuando la base fiscal de un activo es MENOR que su valor en libros","Cuando la base fiscal es mayor que el valor en libros","Cuando hay pérdidas fiscales","Cuando se pagan dividendos"],"respuesta_correcta":"Cuando la base fiscal de un activo es MENOR que su valor en libros","explicacion":"Si el valor en libros > base fiscal, en el futuro se pagará más impuesto. Esta diferencia temporaria imponible genera un Pasivo por Impuesto Diferido."}'::jsonb),

  (15, 'multiple_choice', 3,
   '{"pregunta":"Según la NIIF 3, en una combinación de negocios, ¿cómo se mide la Plusvalía (Goodwill)?","opciones":["Contraprestación transferida + interés no controlador - valor razonable de activos netos adquiridos","Costo histórico de los activos adquiridos","Valor en libros de la empresa adquirida","Precio de mercado de las acciones emitidas"],"respuesta_correcta":"Contraprestación transferida + interés no controlador - valor razonable de activos netos adquiridos","explicacion":"Goodwill = Precio pagado + Participación no controladora - Valor razonable de activos netos. Representa el valor pagado por encima de los activos identificables."}'::jsonb),

  (16, 'completar_espacio', 3,
   '{"pregunta":"Según la NIC 8, los errores contables de períodos anteriores deben corregirse de forma _____, reexpresando los estados comparativos.","respuesta_correcta":"retroactiva","explicacion":"La corrección de errores de períodos anteriores se aplica retroactivamente: se reexpresan los EF comparativos como si el error nunca hubiera ocurrido."}'::jsonb),

  -- ── SENIOR (dificultad 4) ─────────────────────────────────────
  (17, 'multiple_choice', 4,
   '{"pregunta":"Una empresa compra bonos del Estado con intención de cobrar los flujos contractuales (solo capital e intereses). ¿En qué categoría NIIF 9 se clasifican?","opciones":["Costo Amortizado","Valor Razonable con cambios en Resultados","Valor Razonable con cambios en ORI","Instrumento de Patrimonio"],"respuesta_correcta":"Costo Amortizado","explicacion":"Para clasificar a Costo Amortizado se requiere: 1) modelo de negocio de cobrar flujos contractuales, y 2) flujos que son solo pagos de capital e intereses. Los bonos del Estado normalmente cumplen ambas condiciones."}'::jsonb),

  (18, 'multiple_choice', 4,
   '{"pregunta":"Un plan de pensiones de beneficio definido obliga a la empresa a pagar pensiones futuras. ¿Cómo afecta esto al balance?","opciones":["Se reconoce un pasivo por la obligación actuarial estimada","Se registra solo cuando el empleado se pensiona","Se revela solo en notas","Se descuenta únicamente si el plan no está financiado"],"respuesta_correcta":"Se reconoce un pasivo por la obligación actuarial estimada","explicacion":"NIC 19 exige que el pasivo por beneficio definido refleje el valor presente de las obligaciones estimadas, calculadas por un actuario, menos los activos del plan."}'::jsonb),

  (19, 'verdadero_falso', 4,
   '{"pregunta":"Según la NIC 36, la Plusvalía debe probarse por deterioro al menos ANUALMENTE, incluso si no hay indicios de deterioro.","opciones":["Verdadero","Falso"],"respuesta_correcta":"Verdadero","explicacion":"La Plusvalía y otros activos intangibles con vida útil indefinida deben probarse por deterioro anualmente y cada vez que haya indicios, sin excepción."}'::jsonb),

  (20, 'multiple_choice', 4,
   '{"pregunta":"¿Cuál es la diferencia clave entre NIIF 15 y la anterior NIC 18?","opciones":["NIIF 15 usa un modelo único de 5 pasos para todos los contratos con clientes","NIC 18 requería más revelaciones","NIIF 15 solo aplica a empresas cotizadas","NIC 18 usaba un modelo de 5 pasos"],"respuesta_correcta":"NIIF 15 usa un modelo único de 5 pasos para todos los contratos con clientes","explicacion":"NIC 18 tenía criterios distintos para bienes y servicios. NIIF 15 unificó el tratamiento en un modelo de 5 pasos aplicable a todos los contratos con clientes."}'::jsonb),

  (21, 'completar_espacio', 4,
   '{"pregunta":"La norma que guía a una empresa cuando adopta las NIIF por primera vez es la _____ 1.","respuesta_correcta":"NIIF","explicacion":"La NIIF 1 (Adopción por Primera Vez de las NIIF) establece los procedimientos para la transición, incluyendo el balance de apertura y las exenciones permitidas."}'::jsonb)

) AS lec(orden, tipo_ejercicio, dificultad, contenido_json)
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════════
--  VERIFICACIÓN: Contar lecciones insertadas por nivel
-- ══════════════════════════════════════════════════════════════════
SELECT
  n.titulo AS nivel,
  n.orden,
  l.dificultad,
  COUNT(*)  AS total_lecciones
FROM lecciones l
JOIN niveles n ON n.id = l.nivel_id
WHERE n.orden IN (3, 4, 5)
GROUP BY n.titulo, n.orden, l.dificultad
ORDER BY n.orden, l.dificultad;

