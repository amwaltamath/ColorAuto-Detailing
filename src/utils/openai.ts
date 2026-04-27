export interface LeadQualification {
  intent: 'pricing' | 'booking' | 'service_question' | 'support' | 'other';
  urgency: 'low' | 'medium' | 'high';
  fit: 'cold' | 'warm' | 'hot';
  confidence: number;
  nextAction: string;
  summary: string;
  provider: 'openai' | 'fallback';
}

export interface AIEmployeeReplyInput {
  message: string;
  visitorName?: string;
}

interface OpenAIMessage {
  role: 'system' | 'user';
  content: string;
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const DEFAULT_MODEL = 'gpt-4o-mini';

function getOpenAIKey(): string {
  const key = (process.env.OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY || '').trim();
  if (!key) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return key;
}

function getModel(): string {
  return (process.env.OPENAI_MODEL || import.meta.env.OPENAI_MODEL || DEFAULT_MODEL).trim();
}

function getBaseUrl(): string {
  return (process.env.OPENAI_BASE_URL || import.meta.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim();
}

function sanitizeContent(content: string): string {
  return content.replace(/[\r\n]+/g, ' ').trim().slice(0, 1500);
}

function clampConfidence(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return num;
}

function fallbackQualification(message: string): LeadQualification {
  const lowered = message.toLowerCase();
  const looksHot = /book|schedule|today|asap|appointment/.test(lowered);
  const looksPricing = /price|cost|quote|how much/.test(lowered);

  return {
    intent: looksPricing ? 'pricing' : looksHot ? 'booking' : 'service_question',
    urgency: looksHot ? 'high' : 'medium',
    fit: looksHot ? 'hot' : 'warm',
    confidence: 0.45,
    nextAction: looksHot ? 'Offer earliest available appointment and confirm vehicle details.' : 'Ask vehicle year/make/model and preferred service package.',
    summary: sanitizeContent(message),
    provider: 'fallback',
  };
}

function fallbackEmployeeReply(message: string): string {
  const lowered = message.toLowerCase();

  if (/book|schedule|appointment|available|availability/.test(lowered)) {
    return 'I can help with booking. Share your vehicle year, make, model, and your preferred day and time, and I can help line up the right service.';
  }

  if (/price|cost|quote|how much/.test(lowered)) {
    return 'I can help with pricing. Tell me the vehicle year, make, model, and the service you are considering, and I can provide a ballpark quote.';
  }

  if (/ceramic|coating|ppf|paint protection|window tint|tint|detail/.test(lowered)) {
    return 'Great question. We offer detailing, ceramic coating, paint protection film (PPF), and window tint. Tell me your vehicle and goal, and I can recommend the best option.';
  }

  return 'Thanks for your message. I can help with booking, pricing, and service questions. Tell me your vehicle details and what you want done.';
}

async function createChatCompletion(messages: OpenAIMessage[]): Promise<string> {
  const apiKey = getOpenAIKey();
  const model = getModel();
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as OpenAIChatCompletionResponse;
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenAI returned empty content');
  }

  return content;
}

export async function qualifyLeadMessage(input: {
  message: string;
  visitorName?: string;
}): Promise<LeadQualification> {
  const message = input.message.trim();
  if (!message) {
    return {
      intent: 'other',
      urgency: 'low',
      fit: 'cold',
      confidence: 0,
      nextAction: 'Ask the visitor for details about their service needs.',
      summary: '',
      provider: 'fallback',
    };
  }

  const safeMessage = sanitizeContent(message);
  const safeName = sanitizeContent(input.visitorName || '');

  const systemPrompt = [
    'You are a lead-qualification assistant for an auto detailing shop.',
    'Classify inbound chat intent and urgency for staff routing.',
    'Return strictly valid JSON with these keys:',
    'intent, urgency, fit, confidence, nextAction, summary.',
    'intent must be one of: pricing, booking, service_question, support, other.',
    'urgency must be one of: low, medium, high.',
    'fit must be one of: cold, warm, hot.',
    'confidence must be a number from 0 to 1.',
    'Keep nextAction and summary concise and practical.',
  ].join(' ');

  try {
    const raw = await createChatCompletion([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Visitor name: ${safeName || 'Unknown'}\nMessage: ${safeMessage}`,
      },
    ]);

    const parsed = JSON.parse(raw) as Partial<LeadQualification>;
    const intentValues = new Set(['pricing', 'booking', 'service_question', 'support', 'other']);
    const urgencyValues = new Set(['low', 'medium', 'high']);
    const fitValues = new Set(['cold', 'warm', 'hot']);

    return {
      intent: intentValues.has(String(parsed.intent))
        ? (parsed.intent as LeadQualification['intent'])
        : 'other',
      urgency: urgencyValues.has(String(parsed.urgency))
        ? (parsed.urgency as LeadQualification['urgency'])
        : 'low',
      fit: fitValues.has(String(parsed.fit))
        ? (parsed.fit as LeadQualification['fit'])
        : 'cold',
      confidence: clampConfidence(parsed.confidence),
      nextAction: sanitizeContent(parsed.nextAction || 'Ask follow-up questions to clarify service needs.'),
      summary: sanitizeContent(parsed.summary || safeMessage),
      provider: 'openai',
    };
  } catch (error) {
    console.error('[openai] qualifyLeadMessage fallback:', error);
    return fallbackQualification(message);
  }
}

export async function generateAIEmployeeReply(input: AIEmployeeReplyInput): Promise<string> {
  const message = String(input.message || '').trim();
  if (!message) return fallbackEmployeeReply('');

  const safeMessage = sanitizeContent(message);
  const safeName = sanitizeContent(input.visitorName || '');

  const systemPrompt = [
    'You are a helpful customer assistant for Color Auto Detailing.',
    'Your job is to help website visitors with booking and service questions.',
    'Keep replies concise, warm, and practical.',
    'When useful, ask for missing booking details: vehicle year, make, model, desired service, and preferred date/time.',
    'Do not invent prices, promises, or unavailable services.',
    'If pricing is requested without enough details, ask follow-up questions needed for a quote.',
    'Return strictly valid JSON with one key: reply.',
    'The reply value must be plain text under 500 characters.',
  ].join(' ');

  try {
    const raw = await createChatCompletion([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Visitor name: ${safeName || 'Unknown'}\nMessage: ${safeMessage}`,
      },
    ]);

    const parsed = JSON.parse(raw) as { reply?: string };
    const reply = sanitizeContent(parsed.reply || '');
    return reply || fallbackEmployeeReply(message);
  } catch (error) {
    console.error('[openai] generateAIEmployeeReply fallback:', error);
    return fallbackEmployeeReply(message);
  }
}

export function isAIQualificationEnabled(): boolean {
  const enabled = (process.env.AI_QUALIFICATION_ENABLED || import.meta.env.AI_QUALIFICATION_ENABLED || 'false').toLowerCase();
  return enabled === 'true';
}

export function isAIChatEnabled(): boolean {
  const enabled = (process.env.AI_CHAT_ENABLED || import.meta.env.AI_CHAT_ENABLED || 'false').toLowerCase();
  return enabled === 'true';
}

export function getAIEmployeeName(): string {
  return (process.env.AI_EMPLOYEE_NAME || import.meta.env.AI_EMPLOYEE_NAME || 'ColorAuto AI').trim();
}

export function getAIReplyConfidenceThreshold(): number {
  const threshold = parseFloat(
    process.env.AI_REPLY_CONFIDENCE_THRESHOLD ||
    import.meta.env.AI_REPLY_CONFIDENCE_THRESHOLD ||
    '0.4'
  );
  return Number.isFinite(threshold) ? Math.max(0, Math.min(1, threshold)) : 0.4;
}

export function getAIReplyRateLimitMs(): number {
  const ms = parseInt(
    process.env.AI_REPLY_RATE_LIMIT_MS ||
    import.meta.env.AI_REPLY_RATE_LIMIT_MS ||
    '2000',
    10
  );
  return Number.isFinite(ms) && ms > 0 ? ms : 2000;
}

export function detectHandoffRequest(message: string): boolean {
  const lowered = message.toLowerCase();
  const handoffPhrases = [
    /\btalk to (a )?person\b/,
    /\bspeak to (a )?person\b/,
    /\bspeak to (an )?employee\b/,
    /\bspeak to (an )?agent\b/,
    /\bhuman (agent|support|representative)\b/,
    /\breal person\b/,
    /\btransfer\b/,
    /\bconnect (me )?to (someone|an employee)\b/,
  ];
  return handoffPhrases.some((phrase) => phrase.test(lowered));
}

export function shouldQualifyForAIReply(qualification: LeadQualification): boolean {
  const threshold = getAIReplyConfidenceThreshold();
  const qualifyingIntents = new Set(['booking', 'pricing', 'service_question']);
  return qualifyingIntents.has(qualification.intent) && qualification.confidence >= threshold;
}
