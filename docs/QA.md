# Verificación de ARENALES PEGBALL

Fecha: 3 de noviembre de 2026. Entorno: macOS ARM64, Node 24, Chromium real, Firebase Auth y Firestore Emulator Suite con Java 21. Proyecto de pruebas `demo-arenales-pegball`; cero participantes creados en producción.

| Comprobación | Resultado ejecutado |
|---|---|
| Puntuación, combos exclusivos, canasta y bonus | 12 tests de lógica aprobados |
| Colisiones y rebotes Matter, determinismo, fin acotado, canasta | 5 tests de físicas aprobados |
| Contorno geográfico | Superposición inspeccionada visualmente contra JPG original |
| Distribución | 60 posiciones únicas dentro del contorno; 48 cyan y 12 doradas |
| Nivel ganable | Simulación completa con cuatro tiros razonables, 12/12 objetivos |
| Reglas Firestore | 4 pruebas de integración aprobadas, con casos de rechazo |
| Privacidad | Otros UIDs no pueden leer la partida; ranking sin datos privados |
| Recuperación | Tiro reservado recuperado desde Firestore; reproducción idéntica |
| Carga | 50 clientes simultáneos, 1.100 escrituras totales, todos finalizados |
| Táctil móvil | Entrada real touch vía Chromium, impactos, puntos y dorados |
| Recarga durante tiro | Conserva tiros usados y guarda resultado al finalizar recuperación |
| Ranking | Listener en otro contexto recibe partida finalizada |
| Administración | Cancelar conserva ronda; confirmar la incrementa; historial conservado |
| Nueva ronda | Bloquea escrituras antiguas y habilita otra partida en el mismo navegador |
| Portrait y scroll | 390 × 664/844 y 360 × 640; sin scroll durante partida |
| Horizontal móvil | Aviso para rotar visible |
| Escritorio | Capturas en 1440 × 1000 |
| Pérdida de conexión | Error visible, reintento automático al volver la red y mismo número de tiros |
| Build | Vite producción aprobado |
| Dependencias | Auditoría sin vulnerabilidades conocidas tras override gRPC |

Resultado final: **17/17 pruebas de unidad y físicas, 4/4 pruebas Firestore y 4/4 recorridos Chromium aprobados**. Los cuatro recorridos finales se ejecutaron en aproximadamente 1 minuto.

La duración de la prueba de carga y los eventos de listener se registran en `load-test.json`. Es una prueba local de concurrencia y permisos, no una medición de la red ni de cuotas de producción.

Capturas: `mobile-registration.png`, `mobile-game.png`, `mobile-after-shot.png`, `desktop-registration.png`, `ranking-desktop.png`. El ranking de ejemplo proviene únicamente del emulador.

Hosting y reglas publicados y verificados en las tres URLs reales de arenales-pegball.web.app. Se comprobó Authentication anónimo, lectura de ronda y listeners en producción, sin registrar jugadores de prueba. Los recorridos de partidas completas, escrituras de resultados, carga y reset se ejecutaron en emuladores. No se han probado dispositivos físicos, Safari ni redes celulares reales.
