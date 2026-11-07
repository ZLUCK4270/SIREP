# **SIREP: Semana 1, día 1**

Asignación de tareas del equipo de desarrollo  
Lunes 2 de noviembre de 2026

## **Contexto**

SIREP digitaliza los reportes técnicos escritos a mano que hoy están archivados en folders, entre 400 y 500\. La secretaria escanea cada reporte en la impresora multifuncional y lo envía por Telegram. El sistema lee el escaneo con un modelo de IA multimodal, extrae los campos del formulario, pregunta solo lo que no pudo leer y guarda el registro junto con el escaneo original. El escaneo es gradual, un reporte a la vez, por lo que no se necesita carga masiva ni procesamiento por lotes.  
Los datos terminan en RP-TECH, el sistema de órdenes de servicio técnico. SIREP es la puerta de entrada del histórico de reportes, no un sistema con datos propios. Los reportes reales también sirven para corregir y ampliar la tabla de reportes de RP-TECH con los campos que hoy no tiene.  
SIREP toma como base el patrón de captura de SIREGG (registro de gastos por Telegram con extracción por IA), sin clonar su repositorio. Más adelante puede convertirse en un módulo de RP-TECH para capturar otros documentos escaneados: reportes técnicos, recibos y comprobantes.

## **Un caso de ejemplo**

> * La secretaria escanea el reporte N° 000845 a 300 dpi y envía el PDF al bot de Telegram.  
> * El bot verifica que el N° 000845 no esté registrado, guarda el escaneo original y lo envía al modelo.  
> * El modelo devuelve cada campo con su nivel de confianza. Cliente, fecha y número de serie salen con confianza alta; el procedimiento, con confianza media; el código de un repuesto, con confianza baja.  
> * El bot pregunta solo por el código del repuesto y envía el recorte de esa zona del escaneo. La secretaria no lo puede leer y responde "no se lee".  
> * El registro se guarda vinculado a su escaneo y el campo dudoso queda marcado. Aparece en la bandeja de revisión, con el recorte de la imagen al lado del campo.  
> * Un técnico revisa la bandeja, reconoce el código y lo corrige. El registro queda completo y se sabe qué leyó el modelo, qué corrigió una persona y de qué escaneo salió cada dato.

Por qué importan estas reglas: con letra manuscrita, una parte de los campos va a salir dudosa siempre. Si el sistema sabe cuáles son, se revisan solo esos. Si no lo sabe, hay que revisar todos los reportes y el sistema no ahorra trabajo.

## **Prueba de viabilidad**

Antes de escribir código de producción se mide qué tan bien se leen estos reportes. La prueba decide qué modelo se usa, cuánta corrección humana hará falta y el tamaño real del trabajo. Hoy se prepara; se corre en los días 2 y 3\.

> * Muestra: entre 20 y 30 reportes representativos, incluidos a propósito los de peor letra. Una muestra solo de reportes legibles da un resultado optimista que no sirve para planificar.  
> * Referencia: cada reporte de la muestra se transcribe a mano. Es la versión correcta contra la que se mide.  
> * Comparación: los mismos reportes pasan por al menos dos modelos y los resultados se comparan campo por campo, no reporte por reporte.

| Métrica | Para qué sirve |
| :---- | :---- |
| Precisión por campo | Saber qué campos son confiables y cuáles necesitarán revisión siempre. |
| Porcentaje de campos que necesitan corrección humana | Calcular el esfuerzo real de digitalizar los 400 a 500 reportes. |
| Relación entre la confianza declarada y el acierto | Saber si el modelo reconoce cuándo se equivoca. Si no lo reconoce, la bandeja de revisión no sirve. |
| Costo por reporte | Presupuestar. |
| Diferencia entre modelos | Elegir el modelo. |

La tercera métrica es la más importante. Un modelo que acierta el 85% y marca como dudoso el 15% en que falla es utilizable, porque se revisa solo ese 15%. Un modelo que acierta el 85% con confianza alta en todo obliga a revisar el 100%.  
Los modelos se usan por API, con facturación por consumo. Una suscripción de chat no sirve para este sistema.

## **Qué está definido y qué no**

| Definido (se trabaja hoy) | Pendiente |
| :---- | :---- |
| Repositorio propio, recepción de escaneos por Telegram, pieza de IA intercambiable, inventario del formulario físico, muestra y transcripción de referencia para la prueba. | Cambios a la tabla de reportes de RP-TECH (se acuerdan hoy con Adrián), modelo a usar (lo decide la prueba), diálogo de corrección campo por campo, bandeja de revisión, exportación a Excel, servidor de publicación. |

## **Decisiones tomadas**

> * SIREP tiene repositorio propio y se integra a RP-TECH más adelante como módulo.  
> * No hay esquema propio de reportes. Se usa la tabla de reportes de RP-TECH, ampliada con lo que aparezca en los reportes reales. Así no hay que migrar después cientos de registros ya digitalizados.  
> * Los reportes históricos se marcan con origen "histórico". Los campos que RP-TECH exige en los reportes nuevos (fotos de ingreso y salida, firmas, N° de caso) son opcionales para ellos, porque el papel no los tiene.  
> * Los duplicados se detectan por el N° impreso del talonario. La huella del archivo (SHA-256) solo detecta el reenvío del mismo archivo: si la misma hoja se escanea dos veces, la impresora genera dos archivos distintos.  
> * La pieza de IA es un paquete TypeScript independiente, sin dependencias de NestJS ni de Next.js, para que la usen SIREP, SIREGG y RP-TECH sin reescribirla.

## **Stack**

> * Backend: NestJS con TypeScript, con el mismo patrón que SIREGG.  
> * Base de datos y archivos: Supabase (PostgreSQL y Storage). En producción, los datos se guardan en la base de RP-TECH. En desarrollo se trabaja con Supabase CLI en local, con la tabla de reportes copiada de las migraciones de RP-TECH. Todo cambio de base de datos va en migraciones versionadas.  
> * Pieza de IA: paquete independiente dentro del repositorio, en su propia carpeta, con su propia interfaz y pruebas.  
> * Canal de entrada: bot de Telegram con webhook validado por secret\_token.  
> * Bandeja de revisión: Next.js con Tailwind CSS y shadcn/ui, igual que RP-TECH, para que pase a RP-TECH sin rehacerla. Se diseña con el sistema de diseño del equipo en Figma.

Las cuentas de esta etapa son temporales. Al terminar el proyecto se migran a las cuentas oficiales, por eso nada debe depender de configuraciones hechas a mano en el panel de Supabase: todo va en migraciones y scripts.

## **Equipo**

| Rol | Integrante | Responsabilidad |
| :---- | :---- | :---- |
| Líder | Miguel Quijano | Repositorio y tablero, acuerdo del esquema con RP-TECH, prueba de viabilidad, revisión de pull requests. |
| Backend 1 |  | Pieza de IA intercambiable. |
| Backend 2 |  | Base del proyecto, bot de Telegram, recepción y almacenamiento de escaneos. |
| Frontend |  | Inventario del formulario, mapa de regiones y maqueta de la bandeja de revisión. |

El código lo escriben los integrantes nuevos y Miguel lo revisa. Lo que solo sabe una persona y no está escrito se pierde cuando esa persona deja el proyecto.

## **Tareas**

### **Miguel (primera hora)**

> * Crear el repositorio sirep en GitHub, proteger la rama main e invitar al equipo.  
> * Crear el tablero en GitHub Projects con una tarjeta por cada tarea de este documento.  
> * Compartir las variables de entorno por un canal privado, nunca en el repositorio.  
> * Pedir a la secretaria que separe y escanee la muestra de la prueba: entre 20 y 30 reportes, incluidos los de peor letra. Formato: PDF a color, 300 dpi, un archivo por reporte con anverso y reverso, nombrado con el N° del reporte.

Criterios de aceptación: todos clonan el repositorio y lo ejecutan en local; la muestra está escaneada y nombrada antes del mediodía.

### **Miguel (resto del día)**

> * Preparar la plantilla de transcripción: una hoja de cálculo con una fila por reporte y una columna por campo del inventario del formulario.  
> * Reunión con Adrián Miranda (RP-TECH) para comparar el formulario físico con la tabla de reportes de la Especificación v1, usando la tabla de comparación del Frontend. Acordar qué campos se agregan, cuáles son opcionales para el histórico y cómo se proponen los cambios: como migración en el repositorio de RP-TECH, revisada por Adrián.  
> * Revisar los pull requests del equipo.

Criterios de aceptación: la lista de cambios a la tabla de reportes queda acordada con Adrián y escrita en el repositorio; la plantilla de transcripción está lista para repartir.

### **Backend 1: pieza de IA intercambiable**

> * Interfaz con una sola operación: recibe una imagen y la lista de campos esperados, y devuelve el valor de cada campo con su nivel de confianza (alta, media o baja) y una marca cuando el campo no se pudo leer.  
> * Una implementación para Gemini, con gemini.service.ts de SIREGG como referencia, y una segunda para otro proveedor.  
> * El proveedor activo se elige con una variable de entorno. El resto del sistema no sabe cuál está activo.  
> * Registrar los tokens y el costo de cada llamada, porque la prueba de viabilidad los necesita.  
> * Pruebas con respuestas simuladas del proveedor. La prueba con un reporte real se ejecuta a mano, para no generar costo en cada ejecución.

Criterios de aceptación: el mismo reporte se procesa con los dos proveedores cambiando solo la variable de entorno; si el modelo no devuelve un campo, la salida lo marca como no leído en lugar de inventar un valor; cada llamada registra su costo; si el proveedor falla o no responde, se devuelve un error claro y no un registro vacío.

### **Backend 2: base del proyecto y bot de Telegram**

> * Estructura del proyecto NestJS y de Supabase CLI con migraciones versionadas.  
> * README.md con los pasos para levantar el proyecto desde cero y .env.example con todas las variables, sin valores reales.  
> * Webhook de Telegram con validación de secret\_token, con el de SIREGG como base.  
> * Recepción de PDF e imágenes. El PDF se convierte a una imagen por página.  
> * Guardar el escaneo original en Storage, sin comprimir, porque es el archivo del reporte. Para el modelo se usa una copia comprimida. El valor de SIREGG (lado largo de 1600 px) se definió para comprobantes impresos; para manuscrito se ajusta con la prueba de viabilidad.  
> * Tabla de escaneos (ver modelo de datos). El N° del reporte se toma del texto que acompaña el envío o del nombre del archivo. Más adelante lo leerá el modelo y el bot lo confirmará.  
> * Rechazar un N° ya registrado o un archivo con la misma huella, con un aviso a quien envió.

Criterios de aceptación: supabase db reset reconstruye la base completa; un PDF de dos páginas queda guardado con su original y sus dos imágenes; repetir el N° o el archivo muestra un aviso y no crea un registro; un mensaje sin secret\_token válido se rechaza.

### **Frontend: inventario del formulario y bandeja de revisión**

> * Inventario del formulario físico sobre 5 reportes escaneados: cada campo y espacio del papel (casillas, líneas, tablas, firmas y sellos), con su tipo de dato y si suele venir lleno o vacío.  
> * Tabla de comparación con la tabla de reportes de la Especificación v1 de RP-TECH, con las columnas campo del papel, campo de RP-TECH, estado (existe, falta o sobra) y nota. Es el insumo de la reunión de Miguel con Adrián.  
> * Mapa de regiones: como el formulario es siempre el mismo, se marca una vez sobre la plantilla del talonario la zona de cada campo. Con eso se muestra el recorte de la imagen al lado del campo dudoso, sin depender de que el modelo indique dónde está. Si hay talonarios con diseños distintos, un mapa por diseño.  
> * Maqueta en Figma, con el sistema de diseño del equipo, de la bandeja de revisión: lista de reportes con campos dudosos y vista de corrección con el recorte de la imagen al lado de cada campo. Pensada primero para PC.

Criterios de aceptación: la tabla de comparación está completa antes de la reunión de la tarde; el mapa de regiones cubre todos los campos del inventario; la maqueta está revisada por Miguel.

### **Todo el equipo: transcripción de referencia**

> * Transcribir a mano los reportes de la muestra en la plantilla de Miguel, repartidos entre los cuatro. Se empieza hoy y se termina el día 2\.  
> * Lo que no se pueda leer se anota como "ilegible", sin adivinar. Las dudas de vocabulario técnico se consultan con un técnico.  
> * Cada transcripción la revisa otro integrante.

Criterio de aceptación: la muestra completa está transcrita y revisada al cierre del día 2\.

## **Modelo de datos inicial**

Nombres en español y snake\_case. Todas las tablas llevan id (uuid), empresa\_id, creado\_en y actualizado\_en, igual que en RP-TECH.

| Tabla | Campos |
| :---- | :---- |
| escaneos | numero\_reporte (único por empresa), ruta\_original, huella, paginas, enviado\_por, telegram\_chat\_id, estado (recibido, procesado, en\_revision, completo) |
| reportes | La tabla de RP-TECH, con los cambios que acuerden Miguel y Adrián. Para el histórico se agregan origen (historico o sistema), escaneo\_id y numero\_talonario. |
| Revisión de campos | Se define después de la prueba de viabilidad. Debe guardar, por cada campo, el valor que leyó el modelo, su confianza, el valor corregido, quién lo corrigió y cuándo. |

## **Reglas de trabajo**

> * Nadie sube cambios directo a main. Cada tarea va en una rama feature/nombre-de-tarea y se integra con un pull request revisado por Miguel.  
> * Commits con prefijo: feat, fix, chore, docs.  
> * TypeScript en modo estricto.  
> * Las variables de entorno y las claves de los proveedores de IA van en .env y nunca se suben al repositorio.  
> * Los escaneos reales no se suben al repositorio, porque contienen datos de clientes. Se guardan en una carpeta excluida con .gitignore.  
> * Los comentarios del código explican por qué se hizo algo, no qué hace. Los de SIREGG son un buen modelo.  
> * Los casos difíciles llevan prueba, sobre todo los de extracción dudosa.  
> * Si una tarea depende de algo pendiente, se deja una nota TODO con la referencia y se sigue con lo siguiente.

## **Agenda del día**

| Momento | Actividad |
| :---- | :---- |
| Inicio | Explicación del proyecto con el caso de ejemplo, lectura de este documento y preguntas (30 minutos). Miguel crea el repositorio. |
| Mañana | Avance de tareas. La secretaria escanea la muestra. Frontend termina el inventario y la tabla de comparación antes del mediodía. |
| Tarde | Reunión de Miguel con Adrián sobre la tabla de reportes. Reparto e inicio de la transcripción. |
| Cierre | Demostración de 5 minutos por integrante. |

## **Definición de terminado**

> * Cumple sus criterios de aceptación.  
> * Está integrado en main mediante un pull request aprobado.  
> * Las migraciones corren desde cero con supabase db reset.  
> * Si la tarea agrega una variable o un paso de instalación, README.md y .env.example están actualizados.