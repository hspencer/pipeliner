
# PipeLiner:Step-by-step Semantic Pictogram Architect (v1.5)

**Picto-Pipeline** es una herramienta profesional diseñada para transformar enunciados de lenguaje natural en esquemas de pictogramas SVG semánticos de alta fidelidad.

## Consistencia Transversal
A partir de la v1.5, la aplicación utiliza un esquema de datos unificado en todo el pipeline:
- **UTTERANCE**: El texto de entrada (intención comunicativa).
- **NLU**: El esquema semántico MediaFranca (JSON).
- **VISUAL-BLOCKS**: Los identificadores de componentes visuales.
- **PROMPT**: La estrategia narrativa para el renderizado.
- **SVG**: El código final listo para producción.

## Formato de Intercambio (JSON)
Para evitar problemas de escape en bloques complejos de NLU y SVG, la aplicación opera exclusivamente con **archivos JSON**. 

```json
[
  {
    "id": "R_001",
    "UTTERANCE": "Quiero beber agua",
    "NLU": { ... },
    "VISUAL-BLOCKS": "#person, #glass, #water",
    "PROMPT": "Persona bebiendo de un vaso...",
    "SVG": "<svg>...</svg>"
  }
]
```

## Funcionalidades Clave
- **Batch Processing**: Ejecución en cascada desde la intención hasta el SVG.
- **Search-to-Add**: Si no encuentras una intención, créala directamente desde el buscador.
- **Editable Workbench**: Permite corregir la intención directamente en la lista para regenerar el pipeline.
- **SVG Export**: Descarga de archivos SVG individuales con nomenclatura optimizada.
- **Semantic Monitor**: Seguimiento en tiempo real de las llamadas a la API de Gemini 3.

---
*Optimizado para investigación en lingüística aplicada y accesibilidad cognitiva.*
