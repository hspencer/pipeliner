
export const CANONICAL_CSV = `UTTERANCE	NLU	VISUAL-BLOCKS	PROMPT	SVG
Quiero beber agua	{   "utterance": "I want to drink water",   "lang": "en",   "metadata": {     "speech_act": "directive",     "intent": "desire_expression"   },   "frames": [     {       "frame_name": "Ingestion",       "lexical_unit": "drink",       "roles": {         "Ingestor": {           "type": "Agent",           "ref": "speaker",           "surface": "I"         },         "Ingestibles": {           "type": "Object",           "surface": "water",           "lemma": "water",           "definiteness": "indefinite"         }       }     },     {       "frame_name": "Desire",       "lexical_unit": "want",       "roles": {         "Experiencer": {           "type": "Agent",           "ref": "speaker",           "surface": "I"         },         "DesiredEvent": {           "type": "Event",           "ref_frame": "Ingestion"         }       }     }   ],   "nsm_explictations": {     "WANT": "Someone feels something This person thinks: ‘I want this to happen’",     "DRINK": "Someone puts water or another liquid inside their body through the mouth",     "WATER": "Something People drink it It is clear It is not a thing someone made"   },   "logical_form": {     "event": "drink(I, water)",     "modality": "want(I, event)"   },   "pragmatics": {     "politeness": "neutral",     "formality": "neutral",     "expected_response": "none (self-expression)"   },   "visual_guidelines": {     "focus_actor": "speaker",     "action_core": "drink",     "object_core": "water",     "context": "everyday activity",     "temporal": "immediate"   } }	{empty}	{empty}	{empty}
Quiero comer una manzana	{   "utterance": "I want to eat an apple",   "lang": "en",   "metadata": {     "speech_act": "directive",     "intent": "desire_expression"   },   "frames": [     {       "frame_name": "Ingestion",       "lexical_unit": "eat",       "roles": {         "Ingestor": {           "type": "Agent",           "ref": "speaker",           "surface": "I"         },         "Ingestibles": {           "type": "Object",           "surface": "an apple",           "lemma": "apple",           "definiteness": "indefinite"         }       }     },     {       "frame_name": "Desire",       "lexical_unit": "want",       "roles": {         "Experiencer": {           "type": "Agent",           "ref": "speaker",           "surface": "I"         },         "DesiredEvent": {           "type": "Event",           "ref_frame": "Ingestion"         }       }     }   ],   "nsm_explictations": {     "WANT": "Someone feels something This person thinks: ‘I want this to happen’",     "EAT": "Someone puts food inside their body through the mouth This thing is not water This person does this many times",     "APPLE": "Something It grows on trees People can eat it It is round and has a color like red or green"   },   "logical_form": {     "event": "eat(I, apple)",     "modality": "want(I, event)"   },   "pragmatics": {     "politeness": "neutral",     "formality": "neutral",     "expected_response": "none (self-expression)"   },   "visual_guidelines": {     "focus_actor": "speaker",     "action_core": "eat",     "object_core": "apple",     "context": "everyday activity",     "temporal": "immediate"   } }	{empty}	{empty}	{empty}
Pásame el libro azul	{   "utterance": "Pass me the blue book",   "lang": "en",   "metadata": {     "speech_act": "directive",     "intent": "request"   },   "frames": [     {       "frame_name": "Giving",       "lexical_unit": "pass",       "roles": {         "Donor": {           "type": "Addressee",           "ref": "you",           "surface": "(you)"         },         "Recipient": {           "type": "Agent",           "ref": "speaker",           "surface": "me"         },         "Theme": {           "type": "Object",           "surface": "the blue book",           "lemma": "book",           "definiteness": "definite"         },         "Descriptor": {           "type": "Attribute",           "surface": "blue",           "lemma": "blue"         }       }     }   ],   "nsm_explictations": {     "PASS": "Someone causes something to move from this person to another person Because of this, the other person can have it",     "BOOK": "Something It is made of many pieces of paper People can read it It has words",     "BLUE": "Something has a color This color is like the color of the sky"   },   "logical_form": {     "event": "pass(you, book_blue, speaker)",     "modality": "imperative"   },   "pragmatics": {     "politeness": "neutral",     "formality": "informal",     "expected_response": "compliance"   },   "visual_guidelines": {     "focus_actor": "you",     "secondary_actor": "speaker",     "action_core": "pass",     "object_core": "blue book",     "context": "indoor (eg, classroom or home)",     "temporal": "immediate"   } }	{empty}	{empty}	{empty}
Ayúdame a abrir la puerta	{   "utterance": "Help me open the door",   "lang": "en",   "metadata": {     "speech_act": "directive",     "intent": "request_assistance"   },   "frames": [     {       "frame_name": "Assistance",       "lexical_unit": "help",       "roles": {         "Helper": {           "type": "Addressee",           "ref": "you",           "surface": "(you)"         },         "Beneficiary": {           "type": "Agent",           "ref": "speaker",           "surface": "me"         },         "AssistedEvent": {           "type": "Event",           "ref_frame": "Manipulation"         }       }     },     {       "frame_name": "Manipulation",       "lexical_unit": "open",       "roles": {         "Agent": {           "type": "Agent",           "ref": "speaker",           "surface": "me"         },         "Theme": {           "type": "Object",           "surface": "the door",           "lemma": "door",           "definiteness": "definite"         }       }     }   ],   "nsm_explictations": {     "HELP": "Someone does something because they want another person to be able to do something Because of this, the other person can do it more easily",     "OPEN": "Someone moves something (like a door) so that before people couldn’t go through, and after they can",     "DOOR": "Something It is part of a house or building People can move it to go in or out"   },   "logical_form": {     "event": "help(you, speaker, open(speaker, door))",     "modality": "imperative"   },   "pragmatics": {     "politeness": "neutral",     "formality": "neutral",     "expected_response": "compliance"   },   "visual_guidelines": {     "focus_actor": "you",     "secondary_actor": "speaker",     "action_core": "help",     "object_core": "door",     "context": "indoor",     "temporal": "immediate"   } }	{empty}	{empty}	{empty}
Quiero escuchar música rock	{   "utterance": "I want to listen to rock music",   "lang": "en",   "metadata": {     "speech_act": "directive",     "intent": "desire_expression"   },   "frames": [     {       "frame_name": "Perception_active",       "lexical_unit": "listen",       "roles": {         "Perceiver_agentive": {           "type": "Agent",           "ref": "speaker",           "surface": "I"         },         "Perceived_entity": {           "type": "Sound",           "surface": "rock music",           "lemma": "music",           "definiteness": "indefinite"         },         "Descriptor": {           "type": "Attribute",           "surface": "rock",           "lemma": "rock"         }       }     },     {       "frame_name": "Desire",       "lexical_unit": "want",       "roles": {         "Experiencer": {           "type": "Agent",           "ref": "speaker",           "surface": "I"         },         "DesiredEvent": {           "type": "Event",           "ref_frame": "Perception_active"         }       }     }   ],   "nsm_explictations": {     "WANT": "Someone feels something This person thinks: ‘I want this to happen’",     "LISTEN": "Someone does something with their ears They do it because they want to hear some sounds",     "MUSIC": "Something People can hear it It is made by people making sounds in a special way",     "ROCK": "A kind of music It is loud People play it with guitars and drums Many people like it"   },   "logical_form": {     "event": "listen(I, music_rock)",     "modality": "want(I, event)"   },   "pragmatics": {     "politeness": "neutral",     "formality": "informal",     "expected_response": "none (self-expression)"   },   "visual_guidelines": {     "focus_actor": "speaker",     "action_core": "listen",     "object_core": "rock music",     "context": "leisure activity",     "temporal": "immediate"   } }	{empty}	{empty}	{empty}
Dame mi chaqueta roja	{   "utterance": "Give me my red jacket",   "lang": "en",   "metadata": {     "speech_act": "directive",     "intent": "request"   },   "frames": [     {       "frame_name": "Giving",       "lexical_unit": "give",       "roles": {         "Donor": {           "type": "Addressee",           "ref": "you",           "surface": "(you)"         },         "Recipient": {           "type": "Agent",           "ref": "speaker",           "surface": "me"         },         "Theme": {           "type": "Object",           "surface": "my red jacket",           "lemma": "jacket",           "definiteness": "definite"         },         "Possessor": {           "type": "Agent",           "ref": "speaker",           "surface": "my"         },         "Descriptor": {           "type": "Attribute",           "surface": "red",           "lemma": "red"         }       }     }   ],   "nsm_explictations": {     "GIVE": "Someone causes something to move from them to another person Because of this, the other person has it",     "JACKET": "Something A person wears it on the upper body when it is cold or to go outside",     "RED": "Something has a color This color is like the color of blood or fire"   },   "logical_form": {     "event": "give(you, speaker, jacket_red_possessed_by_speaker)",     "modality": "imperative"   },   "pragmatics": {     "politeness": "neutral",     "formality": "informal",     "expected_response": "compliance"   },   "visual_guidelines": {     "focus_actor": "you",     "secondary_actor": "speaker",     "action_core": "give",     "object_core": "red jacket",     "context": "indoor (home or dressing context)",     "temporal": "immediate"   } }	{empty}	{empty}	{empty}
Necesito ir al baño	{   "utterance": "I need to go to the toilet",   "lang": "en",   "metadata": {     "speech_act": "directive",     "intent": "desire_expression"   },   "frames": [     {       "frame_name": "Motion",       "lexical_unit": "go",       "roles": {         "Agent": {           "type": "Agent",           "ref": "speaker",           "surface": "I"         },         "Goal": {           "type": "Place",           "surface": "the toilet",           "lemma": "toilet",           "definiteness": "definite"         }       }     },     {       "frame_name": "Need",       "lexical_unit": "need",       "roles": {         "Experiencer": {           "type": "Agent",           "ref": "speaker",           "surface": "I"         },         "RequiredEvent": {           "type": "Event",           "ref_frame": "Motion"         }       }     }   ],   "nsm_explictations": {     "NEED": "Someone feels something This person thinks: ‘Something bad will happen if this doesn’t happen’",     "GO": "Someone moves from one place to another place",     "TOILET": "Something It is in a house or building People go there when they want to do something with their body (pee or poop)"   },   "logical_form": {     "event": "go(I, toilet)",     "modality": "need(I, event)"   },   "pragmatics": {     "politeness": "neutral",     "formality": "informal",     "expected_response": "none (self-expression)"   },   "visual_guidelines": {     "focus_actor": "speaker",     "action_core": "go",     "object_core": "toilet",     "context": "bathroom",     "temporal": "immediate"   } }	{empty}	{empty}	{empty}
Quiero jugar con el coche de juguete	{   "utterance": "Quiero jugar con el coche de juguete",   "lang": "es",   "metadata": {     "speech_act": "directive",     "intent": "desire_expression"   },   "frames": [     {       "frame_name": "Play",       "lexical_unit": "jugar",       "roles": {         "Player": {           "type": "Agent",           "ref": "speaker",           "surface": "yo (implícito en 'quiero')"         },         "Co-participant_or_Instrument": {           "type": "Object",           "surface": "con el coche de juguete",           "lemma": "coche de juguete",           "definiteness": "definite"         }       }     },     {       "frame_name": "Desire",       "lexical_unit": "quiero",       "roles": {         "Experiencer": {           "type": "Agent",           "ref": "speaker",           "surface": "yo (implícito)"         },         "DesiredEvent": {           "type": "Event",           "ref_frame": "Play"         }       }     }   ],   "nsm_explictations": {     "QUERER": "Alguien siente algo Esta persona piensa: ‘Quiero que esto pase’",     "JUGAR": "Alguien hace algo por un tiempo Esta persona hace esto porque quiere sentir algo bueno",     "COCHE_DE_JUGUETE": "Algo Es una cosa pequeña Parece un coche real Los niños pueden jugar con esto"   },   "logical_form": {     "event": "play(I, with(toy_car))",     "modality": "want(I, event)"   },   "pragmatics": {     "politeness": "neutral",     "formality": "informal",     "expected_response": "none (self-expression)"   },   "visual_guidelines": {     "focus_actor": "speaker",     "action_core": "play",     "object_core": "toy car",     "context": "playroom or home",     "temporal": "immediate"   } }	{empty}	{empty}	{empty}
Pon la televisión en el canal de dibujos	{   "utterance": "Put the television on the cartoon channel",   "lang": "en",   "metadata": {     "speech_act": "directive",     "intent": "command"   },   "frames": [     {       "frame_name": "Placing",       "lexical_unit": "put",       "roles": {         "Agent": {           "type": "Addressee",           "ref": "you",           "surface": "(you)"         },         "Theme": {           "type": "Object",           "surface": "the television",           "lemma": "television",           "definiteness": "definite"         },         "Goal": {           "type": "Location_or_State",           "surface": "on the cartoon channel",           "lemma": "channel",           "definiteness": "definite"         },         "Descriptor": {           "type": "Attribute",           "surface": "cartoon",           "lemma": "cartoon"         }       }     }   ],   "nsm_explictations": {     "PUT": "Someone causes something to be in a place or state Before, it was not there; after, it is there",     "TELEVISION": "Something People can see moving pictures and hear sounds from it People watch it",     "CHANNEL": "Something people can choose on a television to see different kinds of things",     "CARTOON": "A kind of picture story People draw it It moves Often made for children"   },   "logical_form": {     "event": "put(you, television, on(channel_cartoon))",     "modality": "imperative"   },   "pragmatics": {     "politeness": "neutral",     "formality": "informal",     "expected_response": "compliance"   },   "visual_guidelines": {     "focus_actor": "you",     "action_core": "put",     "object_core": "television",     "context": "living room",     "temporal": "immediate"   } }	{empty}	{empty}	{empty}
Quiero un vaso de leche fría	{empty}	{empty}	{empty}	{empty}
Necesito un lápiz para dibujar	{empty}	{empty}	{empty}	{empty}
Ayúdame a atarme los zapatos	{empty}	{empty}	{empty}	{empty}
Quiero salir al jardín	{empty}	{empty}	{empty}	{empty}
Dame un trozo de pastel de chocolate	{empty}	{empty}	{empty}	{empty}
Necesito papel para escribir una carta	{empty}	{empty}	{empty}	{empty}
Quiero ver una película de aventuras	{empty}	{empty}	{empty}	{empty}
Sube el volumen de la radio	{empty}	{empty}	{empty}	{empty}
Quiero pintar con los colores nuevos	{empty}	{empty}	{empty}	{empty}
Necesito una manta porque tengo frío	{empty}	{empty}	{empty}	{empty}
Ayúdame a encontrar mis gafas	{empty}	{empty}	{empty}	{empty}
Quiero llamar a mi abuela por teléfono	{empty}	{empty}	{empty}	{empty}
Dame la cuchara para la sopa	{empty}	{empty}	{empty}	{empty}
Necesito que me leas un cuento	{empty}	{empty}	{empty}	{empty}
Quiero montar en mi bicicleta	{empty}	{empty}	{empty}	{empty}
Abre la ventana, por favor	{empty}	{empty}	{empty}	{empty}
Quiero comer patatas fritas	{empty}	{empty}	{empty}	{empty}
Necesito ayuda con los deberes de matemáticas	{empty}	{empty}	{empty}	{empty}
Dame el mando a distancia	{empty}	{empty}	{empty}	{empty}
Quiero ir a la piscina	{empty}	{empty}	{empty}	{empty}
Necesito que me peines el pelo	{empty}	{empty}	{empty}	{empty}
Quiero un helado de fresa	{empty}	{empty}	{empty}	{empty}
Pásame la sal, por favor	{empty}	{empty}	{empty}	{empty}
Quiero construir una torre con los bloques	{empty}	{empty}	{empty}	{empty}
Necesito una tirita para mi herida	{empty}	{empty}	{empty}	{empty}
Ayúdame a poner la mesa	{empty}	{empty}	{empty}	{empty}
Quiero beber zumo de naranja	{empty}	{empty}	{empty}	{empty}
Dame mi mochila del colegio	{empty}	{empty}	{empty}	{empty}
Quiero ir al parque de atracciones	{empty}	{empty}	{empty}	{empty}
Necesito que me ayudes a vestirme	{empty}	{empty}	{empty}	{empty}
Quiero comer un sándwich de queso	{empty}	{empty}	{empty}	{empty}
Pásame la botella de agua	{empty}	{empty}	{empty}	{empty}
Quiero jugar al fútbol con mis amigos	{empty}	{empty}	{empty}	{empty}
Necesito que me cortes la carne	{empty}	{empty}	{empty}	{empty}
Quiero ir a la playa	{empty}	{empty}	{empty}	{empty}
Ayúdame a guardar los juguetes	{empty}	{empty}	{empty}	{empty}
Quiero un yogur de plátano	{empty}	{empty}	{empty}	{empty}
Dame el paraguas porque está lloviendo	{empty}	{empty}	{empty}	{empty}
Quiero hacer un puzzle	{empty}	{empty}	{empty}	{empty}
Necesito que me empujes en el columpio	{empty}	{empty}	{empty}	{empty}
Quiero ir a dormir a mi cama	{empty}	{empty}	{empty}	{empty}
Quiero más sopa, por favor	{empty}	{empty}	{empty}	{empty}
Necesito otro plato	{empty}	{empty}	{empty}	{empty}
¿Puedes darme el pan?	{empty}	{empty}	{empty}	{empty}
Quiero sentarme en la silla verde	{empty}	{empty}	{empty}	{empty}
Ayúdame a bajar el juguete de la estantería	{empty}	{empty}	{empty}	{empty}
Quiero usar el ordenador para jugar	{empty}	{empty}	{empty}	{empty}
Necesito que me pongas crema solar	{empty}	{empty}	{empty}	{empty}
Quiero ir de visita a casa de mi primo	{empty}	{empty}	{empty}	{empty}
Dame el tenedor para comer la ensalada	{empty}	{empty}	{empty}	{empty}
Quiero que me compres un globo rojo	{empty}	{empty}	{empty}	{empty}
Necesito cambiarme de ropa	{empty}	{empty}	{empty}	{empty}
Quiero ir al cine a ver la nueva película	{empty}	{empty}	{empty}	{empty}
Ayúdame a limpiar el zumo que he derramado	{empty}	{empty}	{empty}	{empty}
Quiero un trozo más de pizza	{empty}	{empty}	{empty}	{empty}
Dame mi cepillo de dientes	{empty}	{empty}	{empty}	{empty}
Quiero que me hagas cosquillas	{empty}	{empty}	{empty}	{empty}
Necesito que me tapes con la manta	{empty}	{empty}	{empty}	{empty}
Quiero ir a la biblioteca a por un libro	{empty}	{empty}	{empty}	{empty}
Ayúdame a abrir el bote de mermelada	{empty}	{empty}	{empty}	{empty}
Quiero que me cantes una canción	{empty}	{empty}	{empty}	{empty}
Necesito que me seques las manos	{empty}	{empty}	{empty}	{empty}
Quiero ir al zoo a ver los leones	{empty}	{empty}	{empty}	{empty}
Dame mi peluche para dormir	{empty}	{empty}	{empty}	{empty}
Quiero que me abraces	{empty}	{empty}	{empty}	{empty}
Necesito que me pongas el pijama	{empty}	{empty}	{empty}	{empty}
Quiero ir a la fiesta de cumpleaños de mi amigo	{empty}	{empty}	{empty}	{empty}
Ayúdame a hacer la cama	{empty}	{empty}	{empty}	<svg id="pictogram" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 100 100" role="img" class="hc" aria-labelledby="title desc" lang="en-NZ" tabindex="0" focusable="true" data-domain="home" data-intent="directive" data-utterance="Make the bed" style="font-size:12px"><title id="title">Make the bed (directive)</title><desc id="desc">A person standing beside a single bed: frame, mattress, pillow and sheet visible. Intended meaning: action “make” applied to object “bed”; everyday domestic routine.</desc><metadata id="mf-accessibility">{ "schema": "https://pictos.net/schemas/pictogram-accessibility/v1", "utterance": { "text": "Make the bed", "speechAct": "directive", "language": "en-NZ", "domain": "Activities of Daily Living" }, "nsm": { "primes": ["DO","SOMEONE","SOMETHING","PLACE","NOW"], "gloss": "SOMEONE DO something to bed NOW so bed is good to sleep" }, "concepts": [ {"id": "bed", "role": "patient", "kind": "OBJECT"}, {"id": "person", "role": "agent", "kind": "HUMAN"}, {"id": "make", "role": "action", "kind": "VERB"} ], "accessibility": { "readingOrder": ["title","desc","g-person","g-bed"], "keyboard": {"tabStops": ["g-person","g-bed"]}, "contrast": {"preferred": "AA", "strokeMin": 2}, "motion": {"noMotionDefault": true} }, "provenance": { "author": "PictoNet", "license": "CC BY 4.0", "version": "1.0-gs" } }</metadata><defs><style>.f, .k { stroke-linejoin: round; stroke-width: 1ex; } .f { fill: #fff; stroke: #000; } .k { fill: #000; stroke: #fff; } svg.hc .f { fill: #fff; stroke: #000; stroke-width: .4ex; } svg.hc .k { fill: #000; stroke: #fff; stroke-width: .3ex; } .hc svg .f { fill: #fff; stroke: #000; stroke-width: .4ex; } .hc svg .k { fill: #000; stroke: #fff; stroke-width: .3ex; }</style></defs><g id="g-bed" role="group" class="hc f" tabindex="0" aria-label="Bed, the object of the action" data-role="patient" data-concept="bed"><path id="bed_frame" d="M86.6,66.1l6.7,10.9v7.1h-5.1v5.1c0,.9-.7,1.6-1.6,1.6h-2.3c-.9,0-1.6-.7-1.6-1.6v-5.1h-38.2v5.1c0,.9-.7,1.6-1.6,1.6h-2.3c-.9,0-1.6-.7-1.6-1.6v-5.1h-5.1v-7.1l6.7-10.9v-18.5c0-1.3,1.1-2.4,2.4-2.4h41.3c1.3,0,2.4,1.1,2.4,2.4v18.5h-.1Z" aria-label="Bed frame" /><path id="mattress" d="M85.9,78.6h-44.4c-3,0-5.4-2.4-5.4-5.4v-1.9c0-1.5.7-3,1.8-4l7.7-6.8c1-.9,2.3-1.4,3.6-1.4h29c1.3,0,2.6.5,3.6,1.4l7.7,6.8c1.2,1,1.8,2.5,1.8,4v1.9c0,3-2.4,5.4-5.4,5.4Z" aria-label="Mattress" /><path id="pillow" d="M52.2,53.5h22.4c2.3,0,4.1,1.8,4.1,4h0c0,2.2-1.8,4-4.1,4h-22.4c-2.3,0-4.1-1.8-4.1-4h0c0-2.2,1.8-4,4.1-4Z" aria-label="Pillow" /><path id="sheet" d="M50.6,39.6c2.1,1.3,15.3,5.5,15.3,5.5,0,0-1.3,9.6-3.9,12.5-6.3,7.1-17.2,8.3-20.7,10.2s-3.4,9.7.8,10.8c-7.6.3-6.9-8.9-4.2-11.3s7.9-6.7,10.7-11.7c4.1-7.4,2.3-13.8,2-16Z" aria-label="Top sheet, to be pulled and smoothed" /></g><g id="g-person" role="group" class="hc k" tabindex="0" aria-label="Person, the agent who makes the bed" data-role="agent" data-concept="person"><path id="arm" d="M29.9,37.5l4.2,7.8,6.7,3.7c1.1.6,1.5,2.1.7,3.2h0c-.6.8-1.7,1.1-2.6.7l-9.1-3.9-4.1-6.4" aria-label="Arm reaching towards bed" /><path id="body" d="M29,90.5l-4.9.2-5-35.6-3,18.9-4.2,17.1h-5l4.3-19.7.6-19.4c.2-2.1.2-3.2.6-5,0,0,.8-3.7,2-6.9s3.5-7.2,5.2-9.3l2.3-2.7c2.4-2.8,6.7-3.1,9.5-.7l2.1,1.8,7.6,9.2c.8.9,1.8,1.6,3,2l10,3c1.4.4,2.2,2,1.6,3.4h0c-.5,1.1-1.7,1.8-2.9,1.5l-13.7-3.3-9.1-7.5-4.9,7.5,4,45.5h0Z" aria-label="Torso and legs" /><circle id="head" cx="38.9" cy="19.9" r="5.5" aria-label="Head" /></g><text x="-9999" y="-9999" aria-hidden="true">Make the bed</text></svg>
Quiero comer macarrones con tomate	{empty}	{empty}	{empty}	{empty}
Dame el jabón para lavarme las manos	{empty}	{empty}	{empty}	{empty}
Quiero que me cuentes una historia	{empty}	{empty}	{empty}	{empty}
Necesito que me ayudes a subir la cremallera	{empty}	{empty}	{empty}	{empty}
Quiero ir a la montaña de excursión	{empty}	{empty}	{empty}	{empty}
Pásame las tijeras para recortar	{empty}	{empty}	{empty}	{empty}
Quiero que me dejes solo un momento	{empty}	{empty}	{empty}	{empty}
Necesito que bajes la persiana	{empty}	{empty}	{empty}	{empty}
Quiero ir al museo de ciencias	{empty}	{empty}	{empty}	{empty}
Ayúdame a regar las plantas	{empty}	{empty}	{empty}	{empty}
Quiero comer una pera	{empty}	{empty}	{empty}	{empty}
Dame la toalla para secarme	{empty}	{empty}	{empty}	{empty}
Quiero que me expliques cómo funciona este juguete	{empty}	{empty}	{empty}	{empty}
Necesito que me sujetes la bicicleta	{empty}	{empty}	{empty}	{empty}
Quiero ir a la granja a ver los animales	{empty}	{empty}	{empty}	{empty}
Ayúdame a encontrar el mando del coche teledirigido	{empty}	{empty}	{empty}	{empty}
Quiero comer pollo asado con patatas	{empty}	{empty}	{empty}	{empty}
Dame un pañuelo de papel	{empty}	{empty}	{empty}	{empty}
Quiero que juguemos a las cartas	{empty}	{empty}	{empty}	{empty}
Necesito que me ayudes a buscar a mi gato	{empty}	{empty}	{empty}	{empty}
Quiero ir al río a tirar piedras	{empty}	{empty}	{empty}	{empty}
Ayúdame a ponerme el abrigo	{empty}	{empty}	{empty}	{empty}
Quiero que me empujes más alto en el columpio	{empty}	{empty}	{empty}	{empty}
Necesito que me pases el azúcar	{empty}	{empty}	{empty}	{empty}
Quiero ir a la cama de mis padres	{empty}	{empty}	{empty}	{empty}
Dame el cubo y la pala para la arena	{empty}	{empty}	{empty}	{empty}
Quiero que me pongas mi canción favorita	{empty}	{empty}	{empty}	{empty}
Necesito que me ayudes a abrir la caja de galletas	{empty}	{empty}	{empty}	{empty}
Quiero ir a la tienda a comprar chucherías	{empty}	{empty}	{empty}	{empty}
Ayúdame a lavarme los dientes	{empty}	{empty}	{empty}	{empty}
Quiero que me cojas en brazos	{empty}	{empty}	{empty}	{empty}
Necesito que me traigas un vaso de agua	{empty}	{empty}	{empty}	{empty}
Quiero ir a ver los fuegos artificiales	{empty}	{empty}	{empty}	{empty}
Dame un beso de buenas noches	{empty}	{empty}	{empty}	{empty}
Quiero que me dejes la luz encendida	{empty}	{empty}	{empty}	{empty}
Necesito que me arregles el juguete roto	{empty}	{empty}	{empty}	{empty}
Quiero ir a casa de los abuelos	{empty}	{empty}	{empty}	{empty}
Ayúdame, por favor	{empty}	{empty}	{empty}	{empty}
No quiero comer pescado	{empty}	{empty}	{empty}	{empty}
No me gusta la sopa de verduras	{empty}	{empty}	{empty}	{empty}
Quita la música, por favor	{empty}	{empty}	{empty}	{empty}
No quiero ir al colegio hoy	{empty}	{empty}	{empty}	{empty}
No me pongas esa chaqueta, no me gusta	{empty}	{empty}	{empty}	{empty}
Deja de hacerme cosquillas	{empty}	{empty}	{empty}	{empty}
No quiero jugar a ese juego	{empty}	{empty}	{empty}	{empty}
Apaga la luz, quiero dormir	{empty}	{empty}	{empty}	{empty}
No me leas ese cuento otra vez	{empty}	{empty}	{empty}	{empty}
No quiero ir a la piscina, el agua está fría	{empty}	{empty}	{empty}	{empty}
No me gusta que me grites	{empty}	{empty}	{empty}	{empty}
No quiero ir de compras	{empty}	{empty}	{empty}	{empty}
Quita los guisantes de mi plato	{empty}	{empty}	{empty}	{empty}
No quiero cortarme el pelo	{empty}	{empty}	{empty}	{empty}
No me gusta el color amarillo	{empty}	{empty}	{empty}	{empty}
No quiero ponerme los zapatos, me aprietan	{empty}	{empty}	{empty}	{empty}
No apagues la televisión, estoy viendo los dibujos	{empty}	{empty}	{empty}	{empty}
No quiero ir a la cama todavía	{empty}	{empty}	{empty}	{empty}
No me des más brócoli	{empty}	{empty}	{empty}	{empty}
No me gusta que me peinen	{empty}	{empty}	{empty}	{empty}
No quiero ir al médico	{empty}	{empty}	{empty}	{empty}
No me tapes con la manta, tengo calor	{empty}	{empty}	{empty}	{empty}
No quiero hacer los deberes ahora	{empty}	{empty}	{empty}	{empty}
No me gusta el zumo de tomate	{empty}	{empty}	{empty}	{empty}
No quiero ir a esa fiesta	{empty}	{empty}	{empty}	{empty}
No me gusta que me dejen solo	{empty}	{empty}	{empty}	{empty}
No quiero ir en coche, me mareo	{empty}	{empty}	{empty}	{empty}
No me pongas el pijama todavía	{empty}	{empty}	{empty}	{empty}
No quiero comer más, estoy lleno	{empty}	{empty}	{empty}	{empty}
No me gusta el ruido fuerte	{empty}	{empty}	{empty}	{empty}
No quiero ir al parque, está lloviendo	{empty}	{empty}	{empty}	{empty}
No me cantes esa canción	{empty}	{empty}	{empty}	{empty}
No quiero ir a visitar a la tía	{empty}	{empty}	{empty}	{empty}
No quiero lavarme las manos	{empty}	{empty}	{empty}	{empty}
No me gusta la ropa nueva	{empty}	{empty}	{empty}	{empty}
Quiero ir, pero no ahora	{empty}	{empty}	{empty}	{empty}
No quiero la manzana, quiero la pera	{empty}	{empty}	{empty}	{empty}
No quiero el coche rojo, quiero el azul	{empty}	{empty}	{empty}	{empty}
No quiero salir fuera, quiero quedarme dentro	{empty}	{empty}	{empty}	{empty}
No quiero pintar, quiero dibujar	{empty}	{empty}	{empty}	{empty}
Quiero el libro de animales, no el de coches	{empty}	{empty}	{empty}	{empty}
No quiero leche, quiero agua	{empty}	{empty}	{empty}	{empty}
Quiero jugar con los bloques, no con la pelota	{empty}	{empty}	{empty}	{empty}
No quiero ver esta película, quiero ver la otra	{empty}	{empty}	{empty}	{empty}
Quiero el helado de chocolate, no el de fresa	{empty}	{empty}	{empty}	{empty}
No quiero el jersey verde, quiero la sudadera gris	{empty}	{empty}	{empty}	{empty}
Quiero ir al parque, no a la tienda	{empty}	{empty}	{empty}	{empty}
No quiero los macarrones, quiero la sopa	{empty}	{empty}	{empty}	{empty}
Quiero el cuento del lobo, no el de los tres cerditos	{empty}	{empty}	{empty}	{empty}
No quiero el tenedor, necesito una cuchara	{empty}	{empty}	{empty}	{empty}
Quiero la silla grande, no la pequeña	{empty}	{empty}	{empty}	{empty}
No quiero ir a la cama, quiero jugar más	{empty}	{empty}	{empty}	{empty}
Quiero el lápiz de color rojo, no el azul	{empty}	{empty}	{empty}	{empty}
No quiero la manta, quiero el edredón	{empty}	{empty}	{empty}	{empty}
Quiero ir a casa de la abuela, no a casa del tío	{empty}	{empty}	{empty}	{empty}
Quiero el plátano, no la naranja	{empty}	{empty}	{empty}	{empty}
¿Dónde está mi oso de peluche?	{empty}	{empty}	{empty}	{empty}
¿Qué vamos a comer hoy?	{empty}	{empty}	{empty}	{empty}
¿Por qué está lloviendo?	{empty}	{empty}	{empty}	{empty}
¿Cuándo vamos a ir al parque?	{empty}	{empty}	{empty}	{empty}
¿Quién ha llamado por teléfono?	{empty}	{empty}	{empty}	{empty}
¿Cómo funciona este juguete?	{empty}	{empty}	{empty}	{empty}
¿Puedo tomar un helado?	{empty}	{empty}	{empty}	{empty}
¿Falta mucho para llegar?	{empty}	{empty}	{empty}	{empty}
¿Qué es ese ruido?	{empty}	{empty}	{empty}	{empty}
¿Por qué el cielo es azul?	{empty}	{empty}	{empty}	{empty}
¿Dónde has puesto mis zapatos?	{empty}	{empty}	{empty}	{empty}
¿Cuándo es mi cumpleaños?	{empty}	{empty}	{empty}	{empty}
¿Quién va a venir a casa hoy?	{empty}	{empty}	{empty}	{empty}
¿Cómo se llama el perro del vecino?	{empty}	{empty}	{empty}	{empty}
¿Puedo ver la televisión?	{empty}	{empty}	{empty}	{empty}
¿Qué estás haciendo?	{empty}	{empty}	{empty}	{empty}
¿Por qué tengo que ir a la cama?	{empty}	{empty}	{empty}	{empty}
¿Dónde está el mando a distancia?	{empty}	{empty}	{empty}	{empty}
¿Cuándo volverá papá del trabajo?	{empty}	{empty}	{empty}	{empty}
¿Quién se ha comido mi galleta?	{empty}	{empty}	{empty}	{empty}
¿Cómo se hace un pastel de chocolate?	{empty}	{empty}	{empty}	{empty}
¿Puedo jugar con el ordenador?	{empty}	{empty}	{empty}	{empty}
¿Qué hay para cenar?	{empty}	{empty}	{empty}	{empty}
¿Por qué llora el bebé?	{empty}	{empty}	{empty}	{empty}
¿Dónde guardamos las galletas?	{empty}	{empty}	{empty}	{empty}
¿Cuándo vamos a ir de vacaciones?	{empty}	{empty}	{empty}	{empty}
¿Quién es esa persona?	{empty}	{empty}	{empty}	{empty}
¿Cómo vuelan los aviones?	{empty}	{empty}	{empty}	{empty}
¿Puedo salir a jugar al jardín?	{empty}	{empty}	{empty}	{empty}
Hola, ¿cómo estás?	{empty}	{empty}	{empty}	{empty}
Adiós, hasta mañana	{empty}	{empty}	{empty}	{empty}
Por favor, pásame el agua	{empty}	{empty}	{empty}	{empty}
Gracias por la comida	{empty}	{empty}	{empty}	{empty}
Lo siento, he derramado el zumo	{empty}	{empty}	{empty}	{empty}
Buenos días, mamá	{empty}	{empty}	{empty}	{empty}
Buenas noches, papá	{empty}	{empty}	{empty}	{empty}
Con permiso, quiero pasar	{empty}	{empty}	{empty}	{empty}
De nada	{empty}	{empty}	{empty}	{empty}
¿Me puedes ayudar, por favor?	{empty}	{empty}	{empty}	{empty}
Sí, quiero más	{empty}	{empty}	{empty}	{empty}
No, gracias	{empty}	{empty}	{empty}	{empty}
Me gusta mucho este libro	{empty}	{empty}	{empty}	{empty}
No me gusta la coliflor	{empty}	{empty}	{empty}	{empty}
Estoy cansado	{empty}	{empty}	{empty}	{empty}
Tengo hambre	{empty}	{empty}	{empty}	{empty}
Tengo sed	{empty}	{empty}	{empty}	{empty}
Tengo frío	{empty}	{empty}	{empty}	{empty}
Tengo calor	{empty}	{empty}	{empty}	{empty}
Estoy enfermo	{empty}	{empty}	{empty}	{empty}
Me duele la cabeza	{empty}	{empty}	{empty}	{empty}
Estoy contento	{empty}	{empty}	{empty}	{empty}
Estoy triste	{empty}	{empty}	{empty}	{empty}
Estoy enfadado	{empty}	{empty}	{empty}	{empty}
Tengo miedo	{empty}	{empty}	{empty}	{empty}
Estoy aburrido	{empty}	{empty}	{empty}	{empty}
Estoy sorprendido	{empty}	{empty}	{empty}	{empty}
Te quiero mucho	{empty}	{empty}	{empty}	{empty}
Me he caído y me he hecho daño	{empty}	{empty}	{empty}	{empty}
Mi juguete está roto	{empty}	{empty}	{empty}	{empty}
Mira qué dibujo he hecho	{empty}	{empty}	{empty}	{empty}
Ha venido mi amigo a jugar	{empty}	{empty}	{empty}	{empty}
Hoy es mi cumpleaños	{empty}	{empty}	{empty}	{empty}
El perro está ladrando	{empty}	{empty}	{empty}	{empty}
Está lloviendo mucho	{empty}	{empty}	{empty}	{empty}
Ha salido el sol	{empty}	{empty}	{empty}	{empty}
Ese coche es rojo	{empty}	{empty}	{empty}	{empty}
La pelota es grande	{empty}	{empty}	{empty}	{empty}
El gato está durmiendo en el sofá	{empty}	{empty}	{empty}	{empty}
Mañana vamos a ir al zoo	{empty}	{empty}	{empty}	{empty}
Ayer jugué en el parque	{empty}	{empty}	{empty}	{empty}
Mi color favorito es el azul	{empty}	{empty}	{empty}	{empty}
He perdido mi lápiz	{empty}	{empty}	{empty}	{empty}
He encontrado una moneda en el suelo	{empty}	{empty}	{empty}	{empty}
La sopa está muy caliente	{empty}	{empty}	{empty}	{empty}
El hielo está muy frío	{empty}	{empty}	{empty}	{empty}
El abuelo me ha contado un chiste	{empty}	{empty}	{empty}	{empty}
Quiero ser astronauta de mayor	{empty}	{empty}	{empty}	{empty}
Mi hermano pequeño está llorando	{empty}	{empty}	{empty}	{empty}
Vamos a hacer un castillo de arena	{empty}	{empty}	{empty}	{empty}
El tren hace 'chu-chú'	{empty}	{empty}	{empty}	{empty}
La vaca hace 'mu'	{empty}	{empty}	{empty}	{empty}
Los pájaros están cantando en el árbol	{empty}	{empty}	{empty}	{empty}
Me he manchado la camiseta de chocolate	{empty}	{empty}	{empty}	{empty}
Vamos a plantar una semilla en el jardín	{empty}	{empty}	{empty}	{empty}
La luna está en el cielo	{empty}	{empty}	{empty}	{empty}
Las estrellas brillan por la noche	{empty}	{empty}	{empty}	{empty}
Me gusta saltar en los charcos	{empty}	{empty}	{empty}	{empty}
El caracol se esconde en su concha	{empty}	{empty}	{empty}	{empty}
La mariposa vuela entre las flores	{empty}	{empty}	{empty}	{empty}
Me he lavado la cara	{empty}	{empty}	{empty}	{empty}
Me he puesto el pijama	{empty}	{empty}	{empty}	{empty}
He recogido mis juguetes	{empty}	{empty}	{empty}	{empty}
He ayudado a poner la mesa	{empty}	{empty}	{empty}	{empty}
He terminado toda la comida	{empty}	{empty}	{empty}	{empty}
He compartido mis juguetes con mi hermana	{empty}	{empty}	{empty}	{empty}
He dado de comer al perro	{empty}	{empty}	{empty}	{empty}
He regado las plantas	{empty}	{empty}	{empty}	{empty}
He hecho la cama	{empty}	{empty}	{empty}	{empty}
He sacado la basura	{empty}	{empty}	{empty}	{empty}
¿Vamos a la panadería a comprar pan?	{empty}	{empty}	{empty}	{empty}
Necesito ir a la farmacia a por mi medicina	{empty}	{empty}	{empty}	{empty}
Quiero ir a la biblioteca a devolver este libro	{empty}	{empty}	{empty}	{empty}
¿Podemos ir al supermercado a comprar fruta?	{empty}	{empty}	{empty}	{empty}
Hay que llevar el coche al taller porque hace un ruido raro	{empty}	{empty}	{empty}	{empty}
Vamos a la oficina de correos a enviar una carta	{empty}	{empty}	{empty}	{empty}
Quiero ir a la peluquería a cortarme el pelo	{empty}	{empty}	{empty}	{empty}
El médico me va a mirar la garganta en el centro de salud	{empty}	{empty}	{empty}	{empty}
Vamos a la estación de tren a coger el tren	{empty}	{empty}	{empty}	{empty}
Quiero ir a la tienda de juguetes a ver los juguetes nuevos	{empty}	{empty}	{empty}	{empty}
¿Me ayudas a lavarme las manos?	{empty}	{empty}	{empty}	{empty}
Tengo que cepillarme los dientes después de comer	{empty}	{empty}	{empty}	{empty}
Quiero darme un baño con mucha espuma	{empty}	{empty}	{empty}	{empty}
Necesito peinarme antes de salir	{empty}	{empty}	{empty}	{empty}
Vamos a vestirnos para ir al colegio	{empty}	{empty}	{empty}	{empty}
Es hora de irse a la cama a dormir	{empty}	{empty}	{empty}	{empty}
Voy a comer macarrones con tomate	{empty}	{empty}	{empty}	{empty}
Necesito beber agua porque tengo sed	{empty}	{empty}	{empty}	{empty}
Tengo que ordenar mi habitación	{empty}	{empty}	{empty}	{empty}
Ayúdame a hacer los deberes del colegio	{empty}	{empty}	{empty}	{empty}
Voy a jugar al fútbol en el parque	{empty}	{empty}	{empty}	{empty}
Quiero ver una película en la televisión	{empty}	{empty}	{empty}	{empty}
Vamos a leer un cuento antes de dormir	{empty}	{empty}	{empty}	{empty}
Tengo que ponerme el abrigo porque hace frío	{empty}	{empty}	{empty}	{empty}
Vamos a pasear al perro	{empty}	{empty}	{empty}	{empty}
Hoy voy a comer en casa de la abuela	{empty}	{empty}	{empty}	{empty}
Necesito ir al baño a hacer pis	{empty}	{empty}	{empty}	{empty}
Vamos a hacer la compra en el supermercado	{empty}	{empty}	{empty}	{empty}
Quiero ayudar a cocinar la cena	{empty}	{empty}	{empty}	{empty}
Es hora de levantarse de la cama	{empty}	{empty}	{empty}	{empty}
Hoy tenemos clase de música en el colegio	{empty}	{empty}	{empty}	{empty}
En el recreo voy a jugar con mis amigos	{empty}	{empty}	{empty}	{empty}
La profesora nos va a enseñar los números	{empty}	{empty}	{empty}	{empty}
Tengo que llevar mi almuerzo en la mochila	{empty}	{empty}	{empty}	{empty}
Vamos a pintar con acuarelas en la clase de arte	{empty}	{empty}	{empty}	{empty}
En la biblioteca del colegio hay muchos cuentos	{empty}	{empty}	{empty}	{empty}
Hoy tenemos gimnasia y vamos a correr	{empty}	{empty}	{empty}	{empty}
Tengo que hacer una fila para entrar a clase	{empty}	{empty}	{empty}	{empty}
Voy a aprender a escribir mi nombre	{empty}	{empty}	{empty}	{empty}
La campana suena cuando termina el recreo	{empty}	{empty}	{empty}	{empty}
Me gusta el puré de patatas del comedor	{empty}	{empty}	{empty}	{empty}
Voy a sentarme en mi silla en el aula	{empty}	{empty}	{empty}	{empty}
Tengo que colgar mi abrigo en la percha	{empty}	{empty}	{empty}	{empty}
La profesora nos lee un cuento después del recreo	{empty}	{empty}	{empty}	{empty}
Vamos a jugar en el patio del colegio	{empty}	{empty}	{empty}	{empty}
Tengo que levantar la mano para hablar	{empty}	{empty}	{empty}	{empty}
Vamos a aprender las letras del abecedario	{empty}	{empty}	{empty}	{empty}
Mi amigo se sienta a mi lado en clase	{empty}	{empty}	{empty}	{empty}
Tengo que traer mi estuche con lápices	{empty}	{empty}	{empty}	{empty}
El autobús escolar me recoge en la parada	{empty}	{empty}	{empty}	{empty}
Me duele la barriga	{empty}	{empty}	{empty}	{empty}
Tengo tos y mocos	{empty}	{empty}	{empty}	{empty}
Me he hecho una herida en la rodilla	{empty}	{empty}	{empty}	{empty}
Necesito tomar mi medicina	{empty}	{empty}	{empty}	{empty}
Tengo fever y necesito descansar	{empty}	{empty}	{empty}	{empty}
La enfermera me va a poner una tirita	{empty}	{empty}	{empty}	{empty}
Me pica el brazo	{empty}	{empty}	{empty}	{empty}
Tengo que ir al dentista a que me miren los dientes	{empty}	{empty}	{empty}	{empty}
Me he mareado en el coche	{   "utterance": "I have felt sick in the car",   "lang": "en",   "metadata": {     "speech_act": "assertive",     "intent": "inform"   },   "frames": [     {       "frame_name": "Experiencer_focus",       "lexical_unit": "felt",       "roles": {         "Experiencer": {           "type": "Agent",           "ref": "speaker",           "surface": "I"         },         "State": {           "type": "Attribute",           "surface": "sick",           "lemma": "sick"         },         "Location": {           "type": "Place",           "surface": "in the car",           "lemma": "car",           "definiteness": "definite"         }       }     }   ],   "nsm_explictations": {     "FEEL": "Someone feels something inside their body or mind This person knows something about how they feel",     "SICK": "Someone feels something bad in their body Because of this, this person cannot do things like before",     "CAR": "Something It is a thing with wheels People can sit inside it It moves on roads"   },   "logical_form": {     "event": "feel(I, sick, in(car))",     "modality": "past(perfect)"   },   "pragmatics": {     "politeness": "neutral",     "formality": "neutral",     "expected_response": "acknowledgment or sympathy"   },   "visual_guidelines": {     "focus_actor": "speaker",     "action_core": "feel",     "object_core": "sick",     "context": "inside a car",     "temporal": "past (recent)"   } }	{empty}	{empty}	{empty}
El médico me ha dicho que beba mucha agua	{empty}	{empty}	{empty}	{empty}
Tengo sueño porque no he dormido bien	{empty}	{empty}	{empty}	{empty}
Me ha picado un mosquito	{empty}	{empty}	{empty}	{empty}
Necesito sonarme la nariz	{empty}	{empty}	{empty}	{empty}
Me duele la garganta al tragar	{empty}	{empty}	{empty}	{empty}
El oculista me va a mirar los ojos	{empty}	{empty}	{empty}	{empty}
Me he dado un golpe en la cabeza	{empty}	{empty}	{empty}	{empty}
Tengo que ponerme crema en la quemadura del sol	{empty}	{empty}	{empty}	{empty}
Estornudo mucho	{empty}	{empty}	{empty}	{empty}
Tengo que guardar cama porque estoy enfermo	{empty}	{empty}	{empty}	{empty}
El jarabe para la tos sabe mal	{empty}	{empty}	{empty}	{empty}
Vamos a jugar al escondite	{empty}	{empty}	{empty}	{empty}
Quiero montar en el tobogán	{empty}	{empty}	{empty}	{empty}
¿Me empujas en el columpio?	{empty}	{empty}	{empty}	{empty}
Vamos a construir un castillo de arena en la playa	{empty}	{empty}	{empty}	{empty}
Quiero jugar con la pelota	{empty}	{empty}	{empty}	{empty}
Vamos a hacer una carrera	{empty}	{empty}	{empty}	{empty}
Quiero jugar a pillar	{empty}	{empty}	{empty}	{empty}
Vamos a jugar con los coches de juguete en la alfombra	{empty}	{empty}	{empty}	{empty}
Quiero hacer un puzzle de animales	{empty}	{empty}	{empty}	{empty}
Vamos a jugar a las cocinitas	{empty}	{empty}	{empty}	{empty}
Quiero disfrazarme de pirata	{empty}	{empty}	{empty}	{empty}
Vamos a jugar con plastilina de colores	{empty}	{empty}	{empty}	{empty}
Quiero jugar con mi muñecos	{empty}	{empty}	{empty}	{empty}
Vamos a jugar al veo-veo	{empty}	{empty}	{empty}	{empty}
Quiero saltar a la comba	{empty}	{empty}	{empty}	{empty}
Vamos a jugar a las construcciones con bloques	{empty}	{empty}	{empty}	{empty}
Quiero jugar al parchís	{empty}	{empty}	{empty}	{empty}
Vamos a volar una cometa en el campo	{empty}	{empty}	{empty}	{empty}
Quiero jugar con mi tren eléctrico	{empty}	{empty}	{empty}	{empty}
Vamos a jugar a las tiendas	{empty}	{empty}	{empty}	{empty}
Me gusta el color rojo como las fresas	{empty}	{empty}	{empty}	{empty}
El plátano es de color amarillo	{empty}	{empty}	{empty}	{empty}
El cielo es azul cuando no hay nubes	{empty}	{empty}	{empty}	{empty}
La hierba del parque es verde	{empty}	{empty}	{empty}	{empty}
La naranja es de color naranja	{empty}	{empty}	{empty}	{empty}
Las uvas son de color morado	{empty}	{empty}	{empty}	{empty}
El chocolate es de color marrón	{empty}	{empty}	{empty}	{empty}
La nieve es de color blanco	{empty}	{empty}	{empty}	{empty}
La noche es de color negro	{empty}	{empty}	{empty}	{empty}
El elefante es de color gris	{empty}	{empty}	{empty}	{empty}
El flamenco es de color rosa	{empty}	{empty}	{empty}	{empty}
Quiero la camiseta de rayas	{empty}	{empty}	{empty}	{empty}
La pelota tiene círculos de colores	{empty}	{empty}	{empty}	{empty}
Mi pijama tiene estrellas dibujadas	{empty}	{empty}	{empty}	{empty}
La mesa es cuadrada	{empty}	{empty}	{empty}	{empty}
La señal de stop es un octógono	{empty}	{empty}	{empty}	{empty}
El tejado de la casa es un triángulo	{empty}	{empty}	{empty}	{empty}
La galleta es redonda	{empty}	{empty}	{empty}	{empty}
El libro es un rectángulo	{empty}	{empty}	{empty}	{empty}
La cometa tiene forma de rombo	{empty}	{empty}	{empty}	{empty}
Hoy es lunes, empieza la semana	{empty}	{empty}	{empty}	{empty}
Mañana es martes	{empty}	{empty}	{empty}	{empty}
El miércoles tengo clase de natación	{empty}	{empty}	{empty}	{empty}
El jueves vamos a casa de los abuelos	{empty}	{empty}	{empty}	{empty}
El viernes es el último día de colegio de la semana	{empty}	{empty}	{empty}	{empty}
El sábado no hay colegio	{empty}	{empty}	{empty}	{empty}
El domingo vamos a ir de excursión	{empty}	{empty}	{empty}	{empty}
En verano hace mucho calor y vamos a la playa	{empty}	{empty}	{empty}	{empty}
En otoño se caen las hojas de los árboles	{empty}	{empty}	{empty}	{empty}
En invierno hace frío y a veces nieva	{empty}	{empty}	{empty}	{empty}
En primavera salen las flores	{empty}	{empty}	{empty}	{empty}
El número uno	{empty}	{empty}	{empty}	{empty}
Tengo dos manos	{empty}	{empty}	{empty}	{empty}
El semáforo tiene tres colores	{empty}	{empty}	{empty}	{empty}
El coche tiene cuatro ruedas	{empty}	{empty}	{empty}	{empty}
Tengo cinco dedos en cada mano	{empty}	{empty}	{empty}	{empty}
La semana tiene siete días	{empty}	{empty}	{empty}	{empty}
Tengo ocho años	{empty}	{empty}	{empty}	{empty}
Hay diez velas en la tarta	{empty}	{empty}	{empty}	{empty}
El perro es mi mascota	{empty}	{empty}	{empty}	{empty}
El gato duerme mucho	{empty}	{empty}	{empty}	{empty}
El pájaro canta en la ventana	{empty}	{empty}	{empty}	{empty}
El pez nada en la pecera	{empty}	{empty}	{empty}	{empty}
El león es el rey de la selva	{empty}	{empty}	{empty}	{empty}
El elefante tiene una trompa muy larga	{empty}	{empty}	{empty}	{empty}
La jirafa tiene el cuello muy largo	{empty}	{empty}	{empty}	{empty}
El mono come plátanos	{empty}	{empty}	{empty}	{empty}
El oso vive en el bosque	{empty}	{empty}	{empty}	{empty}
El caballo corre muy rápido	{empty}	{empty}	{empty}	{empty}
La vaca nos da la leche	{empty}	{empty}	{empty}	{empty}
La oveja tiene mucha lana	{empty}	{empty}	{empty}	{empty}
El cerdo vive en la granja	{empty}	{empty}	{empty}	{empty}
El pollo hace 'pío, pío'	{empty}	{empty}	{empty}	{empty}
La rana salta cerca del estanque	{empty}	{empty}	{empty}	{empty}
La serpiente se arrastra por el suelo	{empty}	{empty}	{empty}	{empty}
La mariposa tiene alas de colores	{empty}	{empty}	{empty}	{empty}
La abeja produce miel	{empty}	{empty}	{empty}	{empty}
La araña teje su telaraña	{empty}	{empty}	{empty}	{empty}
El delfín salta en el mar	{empty}	{empty}	{empty}	{empty}
El tiburón tiene los dientes afilados	{empty}	{empty}	{empty}	{empty}
Mamá me está leyendo un cuento	{empty}	{empty}	{empty}	{empty}
Papá me va a llevar al parque	{empty}	{empty}	{empty}	{empty}
Mi hermano está jugando con sus juguetes	{empty}	{empty}	{empty}	{empty}
Mi hermana y yo compartimos habitación	{empty}	{empty}	{empty}	{empty}
El abuelo me enseña a pescar	{empty}	{empty}	{empty}	{empty}
La abuela cocina unas galletas deliciosas	{empty}	{empty}	{empty}	{empty}
Mi tío me ha regalado un libro	{empty}	{empty}	{empty}	{empty}
Mi tía viene a visitarnos hoy	{empty}	{empty}	{empty}	{empty}
Voy a jugar con mi primo	{empty}	{empty}	{empty}	{empty}
Mi familia y yo vamos a ir de vacaciones	{empty}	{empty}	{empty}	{empty}
Este es mi amigo Juan	{empty}	{empty}	{empty}	{empty}
La profesora se llama Ana	{empty}	{empty}	{empty}	{empty}
El médico me ha curado la herida	{empty}	{empty}	{empty}	{empty}
El bombero apaga el fuego	{empty}	{empty}	{empty}	{empty}
El policía dirige el tráfico	{empty}	{empty}	{empty}	{empty}
El panadero hace el pan	{empty}	{empty}	{empty}	{empty}
El granjero cuida de los animales	{empty}	{empty}	{empty}	{empty}
El peluquero me corta el pelo	{empty}	{empty}	{empty}	{empty}
El cartero trae las cartas	{empty}	{empty}	{empty}	{empty}
El cocinero prepara la comida en el restaurante	{empty}	{empty}	{empty}	{empty}
La manzana es mi fruta favorita	{empty}	{empty}	{empty}	{empty}
Quiero un plátano para merendar	{empty}	{empty}	{empty}	{empty}
Las fresas son rojas y dulces	{empty}	{empty}	{empty}	{empty}
El zumo de naranja está muy rico	{empty}	{empty}	{empty}	{empty}
La sandía es muy grande y tiene mucha agua	{empty}	{empty}	{empty}	{empty}
Las uvas se comen de una en una	{empty}	{empty}	{empty}	{empty}
La pera es verde y jugosa	{empty}	{empty}	{empty}	{empty}
El melocotón tiene la piel suave	{empty}	{empty}	{empty}	{empty}
Las cerezas vienen de dos en dos	{empty}	{empty}	{empty}	{empty}
El limón es ácido	{empty}	{empty}	{empty}	{empty}
La zanahoria es buena para la vista	{empty}	{empty}	{empty}	{empty}
El tomate es una fruta, pero lo comemos en ensalada	{empty}	{empty}	{empty}	{empty}
La lechuga es la base de la ensalada	{empty}	{empty}	{empty}	{empty}
Las patatas se pueden comer fritas o cocidas	{empty}	{empty}	{empty}	{empty}
El brócoli parece un arbolito	{empty}	{empty}	{empty}	{empty}
La cebolla hace llorar	{empty}	{empty}	{empty}	{empty}
El pepino es refrescante	{empty}	{empty}	{empty}	{empty}
Los guisantes son bolitas verdes	{empty}	{empty}	{empty}	{empty}
El pimiento puede ser rojo, verde o amarillo	{empty}	{empty}	{empty}	{empty}
Las espinacas me dan mucha fuerza	{empty}	{empty}	{empty}	{empty}
El pan se come con casi todo	{empty}	{empty}	{empty}	{empty}
Quiero un plato de arroz con pollo	{empty}	{empty}	{empty}	{empty}
Los macarrones con queso están muy buenos	{empty}	{empty}	{empty}	{empty}
La sopa de fideos me calienta cuando tengo frío	{empty}	{empty}	{empty}	{empty}
Voy a comer una hamburguesa con patatas fritas	{empty}	{empty}	{empty}	{empty}
La pizza es mi comida favorita del sábado	{empty}	{empty}	{empty}	{empty}
El huevo frito tiene una yema amarilla	{empty}	{empty}	{empty}	{empty}
Me gusta el pescado a la plancha	{empty}	{empty}	{empty}	{empty}
El filete de ternera hay que masticarlo bien	{empty}	{empty}	{empty}	{empty}
Las lentejas son muy nutritivas	{empty}	{empty}	{empty}	{empty}
Un vaso de leche antes de dormir	{empty}	{empty}	{empty}	{empty}
El queso se hace con leche	{empty}	{empty}	{empty}	{empty}
El yogur se come con cuchara	{empty}	{empty}	{empty}	{empty}
Me gusta la mantequilla en la tostada	{empty}	{empty}	{empty}	{empty}
Un helado de chocolate de postre	{empty}	{empty}	{empty}	{empty}
Las galletas son para el desayuno	{empty}	{empty}	{empty}	{empty}
Quiero un trozo de tarta de cumpleaños	{empty}	{empty}	{empty}	{empty}
El agua es la mejor bebida cuando tienes sed	{empty}	{empty}	{empty}	{empty}
El zumo de frutas tiene muchas vitaminas	{empty}	{empty}	{empty}	{empty}
Las chucherías se comen solo de vez en cuando	{empty}	{empty}	{empty}	{empty}
Lávate las manos antes de comer	{empty}	{empty}	{empty}	{empty}
Ponte el cinturón de seguridad en el coche	{empty}	{empty}	{empty}	{empty}
Mira a ambos lados antes de cruzar la calle	{empty}	{empty}	{empty}	{empty}
No hables con extraños	{empty}	{empty}	{empty}	{empty}
Recoge tus juguetes después de jugar	{empty}	{empty}	{empty}	{empty}
Comparte tus juguetes con los demás	{empty}	{empty}	{empty}	{empty}
Pide las cosas por favor y da las gracias	{empty}	{empty}	{empty}	{empty}
No pegues a los demás niños	{empty}	{empty}	{empty}	{empty}
Di la verdad	{empty}	{empty}	{empty}	{empty}
Llama a la puerta antes de entrar	{empty}	{empty}	{empty}	{empty}
No interrumpas cuando los mayores hablan	{empty}	{empty}	{empty}	{empty}
Tápate la boca al toser o estornudar	{empty}	{empty}	{empty}	{empty}
Come con la boca cerrada	{empty}	{empty}	{empty}	{empty}
No juegues con la comida	{empty}	{empty}	{empty}	{empty}
Respeta a los mayores	{empty}	{empty}	{empty}	{empty}
Cuida de los animales y las plantas	{empty}	{empty}	{empty}	{empty}
Tira la basura a la papelera	{empty}	{empty}	{empty}	{empty}
Acuéstate a tu hora para poder descansar	{empty}	{empty}	{empty}	{empty}
Si te pierdes, busca a un policía	{empty}	{empty}	{empty}	{empty}
Pide perdón si has hecho algo mal	{empty}	{empty}	{empty}	{empty}`;
