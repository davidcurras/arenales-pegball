# ARENALES PEGBALL

Videojuego web para Expo Carreras 2026, General Arenales (Buenos Aires). Un nivel, 60 pegs, cinco bolas y doce objetivos dorados. HTML5, CSS, JavaScript, Phaser 3 y Matter.js; Firebase Anonymous Authentication, Firestore y Hosting tradicional. Sin React, backend propio ni imágenes o fuentes externas.

## Ejecutar

Requisitos: Node.js 22.12 o superior y npm. Para emuladores: Firebase CLI y Java 21.

```sh
npm ci
npm run dev
```

- Juego local: http://127.0.0.1:5173/
- Práctica sin Firebase ni premios: http://127.0.0.1:5173/?practice=1
- Ranking: http://127.0.0.1:5173/ranking.html
- Administración: http://127.0.0.1:5173/admin.html

La práctica conserva su partida en localStorage y nunca escribe puntajes oficiales. Para volver a probar desde cero se puede usar otro contexto de navegador o borrar únicamente la clave `arenales-practice-v1`. El modo normal requiere las reglas publicadas y conexión. No pasa silenciosamente a práctica si Firebase falla.

## Arquitectura y archivos

```text
index.html                 juego y registro
ranking.html               podio Top 3 y tabla Top 10 oficial para proyección
admin.html                 nueva ronda con confirmación
src/
  game.js                  escena Phaser, dibujo vectorial, entrada táctil
  physics.js               motor Matter.js compartido con las simulaciones
  level.js                 contorno trazado y distribución fija de 60 pegs
  scoring.js               funciones puras de puntuación y desempate
  state.js                 reserva y liquidación de tiros, victoria y derrota
  firebase.js              autenticación, transacciones y listeners
  main.js                  coordinación del juego y recuperación
  ranking.js, admin.js     controladores de las otras dos páginas
  ui.js, style.css         presentación y estados accesibles
public/assets/             SVG geográfico y favicon
tests/                     unidad, físicas, reglas, carga y navegador
scripts/                   vectorización reproducible y búsqueda de solución
docs/                      pruebas, capturas y comparación de mapa
firestore.rules            permisos acotados; nunca permite borrados
firebase.json, .firebaserc  Hosting y único proyecto objetivo
```

Vite sólo empaqueta los tres HTML y sus dependencias locales. Phaser renderiza, procesa entradas y administra el tiempo visual; Matter.js 0.20 calcula todas las colisiones en un módulo independiente con paso fijo de 120 Hz. Es el mismo motor que ejecutan las pruebas, sin depender de un contexto gráfico. El dibujo se adapta con Phaser Scale.FIT, sin deformar el mapa ni desalinear los controles. Sonido opcional con Web Audio.

## Mapa

`src/level.js` contiene el trazado manual del perímetro del archivo original `PartidoArenales.jpg` (600 × 420). Se conserva la relación de aspecto y los entrantes del partido. La otra referencia se utiliza para la paleta y el estilo. `node scripts/vectorize-map.js` regenera `public/assets/arenales-outline.svg` y `docs/map-comparison.html`. Esta última muestra original, vector y superposición; abrir a través del servidor de desarrollo. Se verificó visualmente la superposición en navegador.

## Reglas y puntuación

- 48 cyan: +10 cada uno. 12 dorados: +50 cada uno.
- 5–9 pegs en el mismo tiro: +100; 10 o más: +300. Son excluyentes.
- La canasta duplica la base y el combo del tiro. No devuelve bolas.
- Completar los 12 dorados: +1.000. Cada bola sin utilizar: +500.
- Finalización y bolas restantes se suman después del multiplicador.
- Cada peg cuenta una vez por tiro y desaparece cuando el tiro termina.
- Se gana al eliminar los 12 objetivos; se pierde al terminar el quinto tiro sin completarlos. La victoria tiene prioridad en el último tiro.
- Un tiro termina al salir por abajo, o a los 18 segundos de simulación si una trayectoria excepcional lo retiene. No se concede otra bola.
- Hay una secuencia comprobada ganadora de cuatro tiros con ángulos aproximados 0,85; 0,50; −0,30; −0,675 radianes desde la vertical. La fase de la canasta sólo modifica el puntaje, no las trayectorias. `npm run simulate` vuelve a buscarla.

## Firestore y recuperación

```text
event/current                         {roundId, number, updatedAt}
rounds/{roundId}                       {number, createdAt}
rounds/{roundId}/games/{anonymousUid}   partida privada con datos personales
rounds/{roundId}/scores/{anonymousUid}  proyección pública con nombre abreviado, escuela y localidad
```

Cada navegador usa una identidad anónima persistente. El registro crea una única partida por UID y ronda mediante transacción. Antes de lanzar, otra transacción incrementa los tiros usados y guarda ángulo y fase de la canasta en `inFlight`. El resultado actualiza partida y proyección pública atómicamente. Los números de revisión evitan que respuestas repetidas o dos pestañas consuman tiros adicionales.

Si se cierra el navegador, se recupera el estado del servidor. Un tiro reservado se reproduce desde su comienzo con el mismo ángulo, fase y pegs restantes: consume el tiro ya reservado y no permite cambiar su trayectoria. No se ofrecen tiros nuevos sin confirmar la reserva en el servidor. Un resultado sin conexión muestra el error y bloquea el siguiente lanzamiento hasta guardarse; se puede reintentar y al reconectar se vuelve a intentar. Una recarga recupera el tiro pendiente incluso si la respuesta de guardado anterior se perdió.

El ranking escucha hasta 100 participantes de la ronda (el evento prevé unos 50), ordena en el cliente y muestra el podio Top 3 y una tabla Top 10 debajo, únicamente de partidas finalizadas. Desempate: mayor puntaje, menos bolas utilizadas, finalización de servidor más temprana. La posición provisional incluye activas y finalizadas y está identificada como tal. No requiere índices compuestos.

## Seguridad y límites acordados

- La partida completa sólo la lee su UID; no existe consulta pública de partidas privadas. Por decisión de organización, el ranking público muestra nombre, inicial del apellido, escuela y localidad. El apellido completo sigue en el documento privado. El aviso del registro informa qué datos se publican.
- Las reglas validan campos, tipos, rangos, propietario, avance monotónico, máximo cinco tiros, rondas vigentes y correspondencia entre partida y ranking. No hay permisos globales ni borrados.
- Por pedido explícito, el administrador no tiene login visible ni privilegios especiales: cualquier identidad anónima puede iniciar la siguiente ronda. **Conocer la URL o estudiar el cliente permite reiniciar el evento.** Las reglas no pretenden proteger este acceso. El reset crea una ronda nueva y conserva todo el historial.
- Los puntajes y las colisiones se calculan en el cliente. Las reglas limitan las transiciones, pero no ofrecen validación física autoritativa ni protección contra un usuario técnico que fabrique un resultado. Esto requeriría un servidor de confianza, fuera del alcance acordado.
- Borrar datos del navegador, usar incógnito u otro navegador produce otra identidad. No se puede impedir esto sólo con autenticación anónima. Una recarga normal no reinicia los tiros.
- Requiere internet para el modo oficial; no es una PWA sin conexión. La práctica funciona con los archivos ya cargados.
- Fullscreen se solicita desde la interacción de inicio y tiene botón manual. Si el navegador no lo admite, el diseño usa `100dvh` y sigue siendo jugable. En horizontal táctil se solicita girar el dispositivo.
- Se ejecutaron pruebas con Chromium y emulación de viewport/touch móvil en una computadora. No se afirma prueba en dispositivos físicos Android/iPhone ni validación de Safari.

## Pruebas

```sh
npm test
firebase emulators:start --only firestore,auth --project demo-arenales-pegball
# En otra terminal con los emuladores iniciados:
node --test tests/firebase.test.js
npm run dev
npm run test:browser
```

Alternativa para las pruebas de reglas con arranque y cierre automático: `npm run test:rules`. Para Chromium, instalar una vez con `npx playwright install chromium`.

Los tests de Firebase limpian únicamente el proyecto **demo-arenales-pegball del emulador**. Las pruebas de navegador usan `?emulator=1`, opción que sólo se admite desde localhost. Nunca usarlas contra la URL de producción. Ejecutar reglas/carga antes de navegador porque la carga reinicia los datos locales. Si se cambia el puerto de Vite, actualizar `playwright.config.js`.

Resultados ejecutados el 3 de noviembre de 2026:

- 17 pruebas de unidad y físicas: aprobadas (puntos, combos, canasta, bonus, quinto tiro, victoria, derrota, recuperación, desempates y nivel resoluble).
- 4 pruebas de integración de Firestore: aprobadas con las reglas reales, incluyendo accesos rechazados, recuperación y nueva ronda.
- Carga: 50 clientes concurrentes × registro y cinco tiros; 550 escrituras privadas + 550 públicas. Listener recibió todos los resultados finales. No hubo escrituras de prueba en producción. Métricas en `docs/load-test.json` (emulador local; no representan latencia de producción).
- 4 recorridos Chromium finales aprobados: móvil táctil con recarga durante tiro, partida de cinco tiros con ranking y administración en otros contextos, tamaños pequeño/escritorio, orientación horizontal y pérdida de red con recuperación automática sin tiros extra. Ver `docs/QA.md` para el resultado final y ampliaciones.
- `npm run build`: aprobado. Dependencias empaquetadas localmente; Phaser es el paquete mayor (~332 kB gzip), separado en un chunk asíncrono. No se utilizan CDNs de runtime.
- `npm audit`: sin vulnerabilidades tras fijar una versión corregida de `@grpc/grpc-js` mediante override.

## Publicación exclusivamente en Firebase

El proyecto permitido es **arenales-pegball**. `.firebaserc` y el script deploy lo fijan explícitamente.

```sh
npm run firebase:login
npm run deploy
```

El comando publica sólo Hosting y reglas de Firestore de ese proyecto. No toca Authentication, Storage ni otros proyectos. La primera conexión de la app crea la ronda 1 mediante transacción si no existe; no es necesario cargar datos manualmente. Los datos de prueba del emulador no se exportan ni se publican.

Direcciones publicadas:

- https://arenales-pegball.web.app/
- https://arenales-pegball.web.app/ranking.html
- https://arenales-pegball.web.app/admin.html

El acceso CLI usa `.tools/firebase-config/` con permisos privados, ignorado por Git; se utiliza una carpeta propia porque la configuración global de este equipo no permitía escribir. `npm run firebase:logout` permite cerrar esa sesión. No copiar esta carpeta ni publicarla.

El sitio y las reglas se publicaron el 3 de noviembre de 2026. Se verificaron las tres URLs reales, Authentication anónimo y los listeners de Firestore en producción sin registrar jugadores de prueba. La ronda inicial quedó en 1. `npm run test:production` repite las comprobaciones de lectura y cabeceras y guarda `docs/production-check.json`; no registra jugadores ni reinicia rondas.

## Operación en Expo Carreras

1. Con las reglas y el sitio publicados, abrir `ranking.html` en la computadora del proyector y usar pantalla completa del navegador.
2. Abrir `admin.html` en la computadora de organización. Confirmar que aparece el número de ronda y el estado conectado.
3. Antes de cada grupo, pulsar **Reiniciar ranking**, leer la confirmación y aceptar. Hacerlo antes de que empiecen: también invalida partidas que todavía estén en juego.
4. Compartir el enlace principal con estudiantes. Pedir celular vertical, conexión a internet y mantener el mismo navegador. El formulario sólo pide nombre, apellido, escuela y localidad.
5. Cada participante apunta arrastrando y suelta para lanzar. Debe esperar “puntaje guardado” entre tiros; si falla internet, reconectar y reintentar.
6. Otorgar premios según el Top 3 de **partidas finalizadas**. El indicador provisional del jugador incluye partidas activas y no reemplaza esa clasificación.
7. Mantener la URL de administración entre organizadores para reducir reinicios accidentales; eso no constituye seguridad frente a usuarios técnicos.

Actualización del ranking: se agregó el Top 10 debajo del podio con posición, nombre público y puntaje. Prueba adicional en `tests/browser/ranking.spec.js`: 13 partidas finalizadas y una activa en emuladores; se verificaron límite de diez, exclusión de activas, desempate, cambios en vivo, ronda nueva y pantalla móvil sin desborde horizontal.

Actualización de datos públicos: escuela y localidad se muestran debajo del nombre en podio, Top 10 y listas Top 3. Las reglas exigen que coincidan con el registro privado cuando están presentes; se toleran documentos anteriores sin estos campos. `node scripts/backfill-ranking-details.js` revisa la ronda actual sin escribir; `--apply` completa únicamente esos dos campos en puntuaciones ya existentes, manteniendo puntajes, tiros, estados y fechas. Usa la sesión autorizada del CLI y está limitado a arenales-pegball.
