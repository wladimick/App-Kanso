# Historial conocido para carga inicial de Kanso

**Usuario objetivo:** `2c0b36a8-cb78-4881-a57f-d4959647a522`  
**Fecha de consolidación:** 2026-08-16

Este archivo NO inserta datos. Es el manifiesto de títulos que el usuario ha mencionado previamente y sirve como fuente para un importador TMDB seguro.

## Estado conocido con alta confianza

| Título | Tipo | Estado sugerido | Progreso / nota |
|---|---|---|---|
| Hunter × Hunter | anime | watching | episodio 137 de 148 |
| Platinum End | anime | paused | iniciado, no terminado |
| Fullmetal Alchemist | anime | paused | iniciado, no terminado |
| American Horror Story | series | paused | visto aproximadamente hasta temporada 5/6 |
| Black Rabbit | series | watching | episodio 1 iniciado |
| Naruto | anime | completed | visto |
| One Punch Man | anime | completed | visto y gusta mucho |
| Jujutsu Kaisen | anime | completed | visto |
| Solo Leveling | anime | completed | visto |
| Black Clover | anime | completed | visto |
| Attack on Titan | anime | completed | visto |
| Demon Slayer | anime | completed | visto |
| Tokyo Ghoul | anime | completed | visto |
| Vinland Saga | anime | completed | visto |
| Chainsaw Man | anime | completed | visto |
| Kuroko no Basket | anime | completed | visto |
| Tokyo Revengers | anime | completed | visto |
| Death Note | anime | completed | visto |
| Parasyte | anime | completed | visto |
| Kaiju No. 8 | anime | completed | visto |
| Slam Dunk | anime | completed | visto |
| Saint Seiya / Caballeros del Zodiaco | anime | completed | visto |
| Dragon Ball | anime | completed | visto; antes de importar conviene definir qué series de la franquicia incluir |

## Otros títulos mencionados

- Gachiakuta: aparece como visto, pero conviene confirmar estado exacto por ser una serie reciente.
- Tomodachi Game: aparece entre títulos vistos; confirmar si fue completado.
- Digimon: aparece como visto; definir serie específica antes de resolver TMDB.
- God Eater: identificado en conversación, pero no queda suficientemente claro si debe marcarse como completado.

## Recomendación de importación

No insertar estos registros como `source='manual'` salvo emergencia. La vía recomendada es:

1. resolver cada título contra `tmdb-search`;
2. revisar coincidencias ambiguas (Dragon Ball, Digimon, Fullmetal Alchemist, Saint Seiya);
3. insertar en `library_items` con `source='tmdb'` y el `external_id` real;
4. aplicar `status`, `current_episode`, `current_season`, `total_episodes` cuando corresponda;
5. conservar el mismo `user_id` objetivo.

Esto mantiene ratings, backdrop, temporadas, episodios y relacionados en las fichas ricas de Kanso.
