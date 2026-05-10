-- =====================================================================
-- ContaLearn — Niveles 6, 7 y 8: Tributación
-- Ejecutar en Supabase SQL Editor
-- =====================================================================

-- NIVEL 6: Tributación — Conceptos Básicos
INSERT INTO niveles (titulo, descripcion, emoji, orden, teoria_json)
VALUES (
  'Tributación: Conceptos Básicos',
  'Conoce el sistema tributario colombiano: qué son los impuestos, el IVA y la retención en la fuente.',
  '🧾',
  6,
  '[
    {
      "titulo": "¿Qué son los impuestos?",
      "contenido": "Los impuestos son contribuciones obligatorias que los ciudadanos y empresas pagan al Estado para financiar servicios públicos como salud, educación e infraestructura. En Colombia, la entidad encargada de administrarlos es la DIAN: Dirección de Impuestos y Aduanas Nacionales."
    },
    {
      "titulo": "El IVA en Colombia",
      "contenido": "El Impuesto al Valor Agregado (IVA) es un impuesto indirecto que grava el consumo de bienes y servicios. La tarifa general en Colombia es del 19%. Algunos bienes tienen tarifa del 5%, como ciertos alimentos de la canasta familiar, y otros están excluidos del IVA, como la leche y los productos de primera necesidad."
    },
    {
      "titulo": "Retención en la Fuente",
      "contenido": "La retención en la fuente es un mecanismo de recaudo anticipado del impuesto de renta. El agente retenedor (quien hace el pago) descuenta un porcentaje y lo consigna directamente a la DIAN. Así el Estado recauda el impuesto de manera gradual durante el año, sin esperar a la declaración anual."
    }
  ]'::jsonb
);

-- Lecciones Nivel 6
INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 1, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál es la tarifa general del IVA en Colombia?","opciones":["19%","16%","12%","21%"],"respuesta":"19%"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 2, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué significa DIAN?","opciones":["Dirección de Impuestos y Aduanas Nacionales","Departamento de Impuestos y Aranceles Nacionales","Dirección Internacional de Administración Nacional","División de Instituciones y Actividades Nacionales"],"respuesta":"Dirección de Impuestos y Aduanas Nacionales"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 3, 'verdadero_falso', 1,
  '{"pregunta":"El IVA es un impuesto directo que el contribuyente paga directamente al Estado sin intermediarios.","opciones":["Verdadero","Falso"],"respuesta":"Falso"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 4, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál de estos bienes está EXCLUIDO del IVA en Colombia?","opciones":["Leche natural","Ropa","Electrodomésticos","Calzado"],"respuesta":"Leche natural"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 5, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué tarifa de IVA aplica a algunos alimentos de la canasta familiar básica?","opciones":["5%","0%","19%","12%"],"respuesta":"5%"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 6, 'opcion_multiple', 1,
  '{"pregunta":"La retención en la fuente es:","opciones":["Un mecanismo de recaudo anticipado del impuesto de renta","Un impuesto adicional al IVA","Un descuento comercial que otorga el proveedor","Una multa por pago tardío"],"respuesta":"Un mecanismo de recaudo anticipado del impuesto de renta"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 7, 'verdadero_falso', 1,
  '{"pregunta":"El agente retenedor es quien RECIBE el pago y descuenta la retención.","opciones":["Verdadero","Falso"],"respuesta":"Falso"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 8, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál es el organismo encargado de administrar los impuestos nacionales en Colombia?","opciones":["DIAN","Banco de la República","Ministerio de Hacienda","Contraloría General de la República"],"respuesta":"DIAN"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 9, 'verdadero_falso', 1,
  '{"pregunta":"La retención en la fuente descontada durante el año se abona al impuesto de renta que el contribuyente debe pagar en su declaración anual.","opciones":["Verdadero","Falso"],"respuesta":"Verdadero"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 10, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál de los siguientes es un impuesto INDIRECTO?","opciones":["IVA","Impuesto de renta","Impuesto al patrimonio","Sobretasa empresarial"],"respuesta":"IVA"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 11, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué tipo de impuesto grava las utilidades o ganancias de personas y empresas?","opciones":["Impuesto de renta","IVA","ICA","Impuesto al consumo"],"respuesta":"Impuesto de renta"}'::jsonb
FROM niveles WHERE orden = 6;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 12, 'verdadero_falso', 1,
  '{"pregunta":"El ICA (Impuesto de Industria y Comercio) es un impuesto nacional administrado por la DIAN.","opciones":["Verdadero","Falso"],"respuesta":"Falso"}'::jsonb
FROM niveles WHERE orden = 6;


-- =====================================================================
-- NIVEL 7: Impuesto de Renta
-- =====================================================================
INSERT INTO niveles (titulo, descripcion, emoji, orden, teoria_json)
VALUES (
  'Impuesto de Renta',
  'Aprende quién debe declarar renta, cómo se calcula y cuáles son los plazos y obligaciones.',
  '📊',
  7,
  '[
    {
      "titulo": "¿Qué es el impuesto de renta?",
      "contenido": "El impuesto de renta grava las utilidades o ganancias obtenidas durante el año fiscal (1 de enero al 31 de diciembre). Lo pagan tanto personas naturales como jurídicas (empresas) que superen los topes mínimos establecidos por la ley cada año."
    },
    {
      "titulo": "¿Quién debe declarar renta?",
      "contenido": "Deben declarar las personas naturales que superen alguno de estos topes (valores orientativos): patrimonio mayor a 4.500 UVT, ingresos brutos mayores a 1.400 UVT, consumos con tarjeta de crédito mayores a 1.400 UVT, o consignaciones bancarias mayores a 1.400 UVT. La UVT (Unidad de Valor Tributario) es una medida que actualiza la DIAN cada año."
    },
    {
      "titulo": "Cálculo y tarifa",
      "contenido": "La renta líquida gravable es la base del impuesto: ingresos menos costos, gastos deducibles y rentas exentas. Para personas jurídicas la tarifa general es del 35%. Para personas naturales aplica una tabla progresiva: a mayor renta, mayor porcentaje. Las retenciones en la fuente practicadas durante el año se descuentan del impuesto final a pagar."
    }
  ]'::jsonb
);

-- Lecciones Nivel 7
INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 1, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué grava el impuesto de renta en Colombia?","opciones":["Las utilidades o ganancias del año fiscal","El consumo de bienes y servicios","Las importaciones de mercancía","Los activos fijos de la empresa"],"respuesta":"Las utilidades o ganancias del año fiscal"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 2, 'verdadero_falso', 1,
  '{"pregunta":"Toda persona natural en Colombia, sin importar sus ingresos, está obligada a declarar renta cada año.","opciones":["Verdadero","Falso"],"respuesta":"Falso"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 3, 'opcion_multiple', 1,
  '{"pregunta":"La tarifa general del impuesto de renta para personas jurídicas (empresas) en Colombia es:","opciones":["35%","25%","19%","33%"],"respuesta":"35%"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 4, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál es el año gravable en Colombia?","opciones":["Del 1 de enero al 31 de diciembre","Del 1 de julio al 30 de junio","Del 1 de abril al 31 de marzo","Variable según el contribuyente"],"respuesta":"Del 1 de enero al 31 de diciembre"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 5, 'verdadero_falso', 1,
  '{"pregunta":"Las pérdidas fiscales de un año pueden compensarse con las utilidades de años futuros, reduciendo el impuesto a pagar.","opciones":["Verdadero","Falso"],"respuesta":"Verdadero"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 6, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué es la renta líquida gravable?","opciones":["La base sobre la cual se calcula el impuesto de renta","El total de ingresos brutos del año","El total de gastos deducibles","El impuesto a pagar antes de retenciones"],"respuesta":"La base sobre la cual se calcula el impuesto de renta"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 7, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué son las rentas exentas?","opciones":["Ingresos que la ley permite restar de la base gravable","Ingresos que no es necesario declarar","Ingresos provenientes del exterior","Ingresos en especie de los empleados"],"respuesta":"Ingresos que la ley permite restar de la base gravable"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 8, 'verdadero_falso', 1,
  '{"pregunta":"Los dividendos recibidos por personas naturales residentes en Colombia siempre están completamente exentos del impuesto de renta.","opciones":["Verdadero","Falso"],"respuesta":"Falso"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 9, 'opcion_multiple', 1,
  '{"pregunta":"Una empresa tuvo ingresos de $8.000.000 y costos y gastos deducibles de $5.500.000. ¿Cuál es su renta líquida?","opciones":["$2.500.000","$8.000.000","$5.500.000","$13.500.000"],"respuesta":"$2.500.000"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 10, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué significa UVT en tributación colombiana?","opciones":["Unidad de Valor Tributario","Unidad de Valorización Tributaria","Unidad de Verificación Tributaria","Unidad de Valor Total"],"respuesta":"Unidad de Valor Tributario"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 11, 'verdadero_falso', 1,
  '{"pregunta":"Las retenciones en la fuente practicadas durante el año se descuentan del impuesto de renta final que debe pagar el contribuyente.","opciones":["Verdadero","Falso"],"respuesta":"Verdadero"}'::jsonb
FROM niveles WHERE orden = 7;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 12, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué sistema de tributación aplica una tarifa fija sin importar el nivel de ingresos?","opciones":["Sistema proporcional (flat tax)","Sistema progresivo","Sistema regresivo","Sistema por módulos"],"respuesta":"Sistema proporcional (flat tax)"}'::jsonb
FROM niveles WHERE orden = 7;


-- =====================================================================
-- NIVEL 8: Liquidación y Casos Prácticos
-- =====================================================================
INSERT INTO niveles (titulo, descripcion, emoji, orden, teoria_json)
VALUES (
  'Liquidación y Casos Prácticos',
  'Aplica tus conocimientos tributarios: liquida el IVA, calcula retenciones y resuelve casos reales.',
  '🧮',
  8,
  '[
    {
      "titulo": "Liquidación del IVA",
      "contenido": "Para determinar el IVA a pagar: IVA generado (en ventas) menos IVA descontable (en compras relacionadas con la actividad). Si el resultado es positivo, se paga a la DIAN. Si es negativo, queda un saldo a favor que puede compensarse en el siguiente período o pedirse en devolución."
    },
    {
      "titulo": "Retención en la fuente: tarifas clave",
      "contenido": "Las tarifas más comunes de retención en la fuente son: honorarios de profesionales independientes 10%-11%, servicios en general 4%, compras de bienes 2,5%-3,5%, arrendamientos de bienes inmuebles 3,5%-4%, y dividendos 0%-10% según el monto. Siempre aplica sobre el valor del pago o abono en cuenta."
    },
    {
      "titulo": "Sanciones tributarias",
      "contenido": "No presentar declaraciones o presentarlas con errores genera sanciones. La sanción por extemporaneidad equivale al 5% del impuesto a cargo por mes de retraso (máximo 100%). La sanción por no declarar puede llegar al 20% de las consignaciones bancarias del período. La sanción mínima equivale a 10 UVT."
    }
  ]'::jsonb
);

-- Lecciones Nivel 8
INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 1, 'opcion_multiple', 1,
  '{"pregunta":"¿Cómo se calcula el IVA a pagar en un período?","opciones":["IVA generado en ventas menos IVA descontable en compras","IVA generado más IVA descontable","Total de ventas multiplicado por 19%","Total de compras multiplicado por 19%"],"respuesta":"IVA generado en ventas menos IVA descontable en compras"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 2, 'opcion_multiple', 1,
  '{"pregunta":"Una empresa vende $10.000.000 (IVA 19%) y compra insumos por $5.000.000 (IVA 19%). ¿Cuánto IVA debe pagar a la DIAN?","opciones":["$950.000","$1.900.000","$2.850.000","$500.000"],"respuesta":"$950.000"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 3, 'verdadero_falso', 1,
  '{"pregunta":"Si el IVA descontable (compras) es mayor que el IVA generado (ventas), la empresa tiene un saldo a pagar a la DIAN.","opciones":["Verdadero","Falso"],"respuesta":"Falso"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 4, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál es la tarifa típica de retención en la fuente sobre honorarios de profesionales independientes?","opciones":["10%","2,5%","4%","19%"],"respuesta":"10%"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 5, 'opcion_multiple', 1,
  '{"pregunta":"Un contador cobra honorarios de $3.000.000. La empresa que lo contrata debe practicarle una retención de:","opciones":["$300.000","$570.000","$120.000","$75.000"],"respuesta":"$300.000"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 6, 'verdadero_falso', 1,
  '{"pregunta":"El IVA pagado en compras de bienes para uso personal del dueño de la empresa se puede descontar del IVA a pagar.","opciones":["Verdadero","Falso"],"respuesta":"Falso"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 7, 'opcion_multiple', 1,
  '{"pregunta":"¿Qué consecuencia genera no presentar una declaración tributaria?","opciones":["Sanción por no declarar que puede llegar al 20% de las consignaciones","Solo se generan intereses de mora sin sanción","Se cancela automáticamente el RUT","La DIAN presenta la declaración de oficio sin penalidad"],"respuesta":"Sanción por no declarar que puede llegar al 20% de las consignaciones"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 8, 'opcion_multiple', 1,
  '{"pregunta":"La sanción por extemporaneidad (declarar tarde) equivale a:","opciones":["5% del impuesto por mes de retraso","1% del impuesto por mes de retraso","10% fijo del impuesto total","$1.000.000 por mes de retraso"],"respuesta":"5% del impuesto por mes de retraso"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 9, 'verdadero_falso', 1,
  '{"pregunta":"Las declaraciones tributarias presentadas voluntariamente pueden corregirse antes de que la DIAN las examine oficialmente.","opciones":["Verdadero","Falso"],"respuesta":"Verdadero"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 10, 'opcion_multiple', 1,
  '{"pregunta":"En enero, una empresa tiene IVA generado de $600.000 e IVA descontable de $1.100.000. El resultado es:","opciones":["Saldo a favor de $500.000","IVA a pagar de $500.000","IVA a pagar de $1.700.000","Saldo a favor de $1.100.000"],"respuesta":"Saldo a favor de $500.000"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 11, 'opcion_multiple', 1,
  '{"pregunta":"¿Cuál es la tarifa de retención en la fuente sobre servicios en general?","opciones":["4%","10%","2,5%","7%"],"respuesta":"4%"}'::jsonb
FROM niveles WHERE orden = 8;

INSERT INTO lecciones (nivel_id, orden, tipo_ejercicio, dificultad, contenido_json)
SELECT id, 12, 'verdadero_falso', 1,
  '{"pregunta":"Un saldo a favor de IVA puede solicitarse en devolución a la DIAN o compensarse con otras obligaciones tributarias.","opciones":["Verdadero","Falso"],"respuesta":"Verdadero"}'::jsonb
FROM niveles WHERE orden = 8;
