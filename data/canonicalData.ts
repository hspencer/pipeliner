
import { RowData } from "../types";

export const CANONICAL_DATA: Partial<RowData>[] = [
  {
    "UTTERANCE": "Quiero beber agua.",
    "NLU": {
      "utterance": "I want to drink water.",
      "lang": "en",
      "metadata": {
        "speech_act": "directive",
        "intent": "desire_expression"
      },
      "frames": [
        {
          "frame_name": "Ingestion",
          "lexical_unit": "drink",
          "roles": {
            "Ingestor": { "type": "Agent", "ref": "speaker", "surface": "I" },
            "Ingestibles": { "type": "Object", "surface": "water", "lemma": "water", "definiteness": "indefinite" }
          }
        },
        {
          "frame_name": "Desire",
          "lexical_unit": "want",
          "roles": {
            "Experiencer": { "type": "Agent", "ref": "speaker", "surface": "I" },
            "DesiredEvent": { "type": "Event", "ref_frame": "Ingestion", "surface": "to drink water" }
          }
        }
      ],
      "visual_guidelines": {
        "focus_actor": "speaker",
        "action_core": "drink",
        "object_core": "water",
        "context": "everyday activity",
        "temporal": "immediate"
      }
    }
  },
  {
    "id": "C_002",
    "UTTERANCE": "Ayúdame a hacer la cama",
    "SVG": "<svg id=\"pictogram\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 100 100\" role=\"img\" class=\"hc\" aria-labelledby=\"title desc\" lang=\"en-NZ\" tabindex=\"0\" focusable=\"true\" data-domain=\"home\" data-intent=\"directive\" data-utterance=\"Make the bed\" style=\"font-size:12px\"><title id=\"title\">Make the bed (directive)</title><desc id=\"desc\">A person standing beside a single bed: frame, mattress, pillow and sheet visible.</desc><metadata id=\"mf-accessibility\">{ \"schema\": \"https://pictos.net/schemas/pictogram-accessibility/v1\", \"utterance\": { \"text\": \"Make the bed\", \"speechAct\": \"directive\", \"language\": \"en-NZ\", \"domain\": \"Activities of Daily Living\" }, \"concepts\": [ {\"id\": \"bed\", \"role\": \"patient\", \"kind\": \"OBJECT\"}, {\"id\": \"person\", \"role\": \"agent\", \"kind\": \"HUMAN\"} ], \"accessibility\": { \"readingOrder\": [\"title\",\"desc\",\"g-person\",\"g-bed\"] }, \"provenance\": { \"author\": \"PictoNet\", \"license\": \"CC BY 4.0\", \"version\": \"1.0-gs\" } }</metadata><defs><style>.f, .k { stroke-linejoin: round; stroke-width: 1ex; } .f { fill: #fff; stroke: #000; } .k { fill: #000; stroke: #fff; } svg.hc .f { fill: #fff; stroke: #000; stroke-width: .4ex; } svg.hc .k { fill: #000; stroke: #fff; stroke-width: .3ex; }</style></defs><g id=\"g-bed\" role=\"group\" class=\"hc f\" tabindex=\"0\" aria-label=\"Bed\" data-role=\"patient\" data-concept=\"bed\"><path id=\"bed_frame\" d=\"M86.6,66.1l6.7,10.9v7.1h-5.1v5.1c0,.9-.7,1.6-1.6,1.6h-2.3c-.9,0-1.6-.7-1.6-1.6v-5.1h-38.2v5.1c0,.9-.7,1.6-1.6,1.6h-2.3c-.9,0-1.6-.7-1.6-1.6v-5.1h-5.1v-7.1l6.7-10.9v-18.5c0-1.3,1.1-2.4,2.4-2.4h41.3c1.3,0,2.4,1.1,2.4,2.4v18.5h-.1Z\"/><path id=\"mattress\" d=\"M85.9,78.6h-44.4c-3,0-5.4-2.4-5.4-5.4v-1.9c0-1.5.7-3,1.8-4l7.7-6.8c1-.9,2.3-1.4,3.6-1.4h29c1.3,0,2.6.5,3.6,1.4l7.7,6.8c1.2,1,1.8,2.5,1.8,4v1.9c0,3-2.4,5.4-5.4,5.4Z\"/><path id=\"pillow\" d=\"M52.2,53.5h22.4c2.3,0,4.1,1.8,4.1,4h0c0,2.2-1.8,4-4.1,4h-22.4c-2.3,0-4.1-1.8-4.1-4h0c0-2.2,1.8-4,4.1-4Z\"/><path id=\"sheet\" d=\"M50.6,39.6c2.1,1.3,15.3,5.5,15.3,5.5,0,0-1.3,9.6-3.9,12.5-6.3,7.1-17.2,8.3-20.7,10.2s-3.4,9.7.8,10.8c-7.6.3-6.9-8.9-4.2-11.3s7.9-6.7,10.7-11.7c4.1-7.4,2.3-13.8,2-16Z\"/></g><g id=\"g-person\" role=\"group\" class=\"hc k\" tabindex=\"0\" aria-label=\"Person\" data-role=\"agent\" data-concept=\"person\"><path id=\"arm\" d=\"M29.9,37.5l4.2,7.8,6.7,3.7c1.1.6,1.5,2.1.7,3.2h0c-.6.8-1.7,1.1-2.6.7l-9.1-3.9-4.1-6.4\"/><path id=\"body\" d=\"M29,90.5l-4.9.2-5-35.6-3,18.9-4.2,17.1h-5l4.3-19.7.6-19.4c.2-2.1.2-3.2.6-5,0,0,.8-3.7,2-6.9s3.5-7.2,5.2-9.3l2.3-2.7c2.4-2.8,6.7-3.1,9.5-.7l2.1,1.8,7.6,9.2c.8.9,1.8,1.6,3,2l10,3c1.4.4,2.2,2,1.6,3.4h0c-.5,1.1-1.7,1.8-2.9,1.5l-13.7-3.3-9.1-7.5-4.9,7.5,4,45.5h0Z\"/><circle id=\"head\" cx=\"38.9\" cy=\"19.9\" r=\"5.5\"/></g><text x=\"-9999\" y=\"-9999\" aria-hidden=\"true\">Make the bed</text></svg>"
  }
];
