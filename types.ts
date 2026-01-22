
export interface NLUMetadata {
  speech_act: string;
  intent: string;
}

export interface NLUFrameRole {
  type: string;
  surface: string;
  lemma?: string;
  definiteness?: string;
  ref?: string;
  ref_frame?: string;
}

export interface NLUFrame {
  frame_name: string;
  lexical_unit: string;
  roles: Record<string, NLUFrameRole>;
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
  visual_guidelines: NLUVisualGuidelines;
}

export type StepStatus = 'idle' | 'processing' | 'completed' | 'error' | 'outdated';

export interface RowData {
  id: string;
  UTTERANCE: string;
  NLU?: NLUData | string;
  "VISUAL-BLOCKS"?: string;
  PROMPT?: string;
  SVG?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  nluStatus: StepStatus;
  visualStatus: StepStatus;
  svgStatus: StepStatus;
  nluDuration?: number;
  visualDuration?: number;
  svgDuration?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'success';
  message: string;
}

export interface GlobalConfig {
  lang: string;
  svgSize: number;
  author: string;
  license: string;
}

export const VOCAB = {
  speech_act: ['assertive', 'directive', 'commissive', 'expressive', 'declarative', 'interrogative'],
  intent: ['inform', 'request', 'desire_expression', 'command', 'offer', 'promise', 'thanking', 'greeting', 'question', 'complaint'],
  role_type: ['Agent', 'Object', 'Event', 'Attribute', 'Place', 'Time', 'Abstract', 'Quantity', 'Recipient', 'Instrument'],
  definiteness: ['none', 'definite', 'indefinite'],
  lang: ['en', 'es', 'fr', 'pt', 'it', 'de']
};
