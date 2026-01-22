
export interface NLUMetadata {
  speech_act: string;
  intent: string;
}

export interface NLUFrameRole {
  role_name: string;
  type: string;
  surface: string;
  lemma?: string;
  definiteness?: string;
}

export interface NLUFrame {
  frame_name: string;
  lexical_unit: string;
  roles: NLUFrameRole[];
}

export interface NSMExplication {
  token: string;
  definition: string;
}

export interface NLUVisualGuidelines {
  focus_actor: string;
  action_core: string;
  object_core: string;
  context: string;
  temporal: string;
}

export interface NLUData {
  utterance: string;
  lang: string;
  metadata: NLUMetadata;
  frames: NLUFrame[];
  nsm_explictations: NSMExplication[];
  logical_form: {
    event: string;
    modality: string;
  };
  pragmatics: {
    politeness: string;
    formality: string;
    expected_response: string;
  };
  visual_guidelines: NLUVisualGuidelines;
}

export interface RowData {
  id: string;
  spanish: string;
  english: string;
  nlu?: NLUData | string;
  visualElements?: string;
  imagePrompt?: string;
  svgCode?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'success';
  message: string;
}
