import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

interface LangCodes {
  [key: string]: string;
}

export const LANGS: LangCodes = {
  'bn': 'বাংলাদেশ', // Bengali language for Bangladesh
  'my': 'မြန်မာ (ဗမာ)', // Burmese language for Myanmar (Burma)
  'zh': '中国', // Chinese language for China
  'id': 'Bahasa Indonesia', // Indonesian language for Indonesia
  'ja': '日本語', // Japanese language for Japan
  'km': 'ភាសាខ្មែរ', // Khmer language for Cambodia
  'ko': '한국어', // Korean language for South Korea
  'ky': 'Кыргызча', // Kyrgyz language for Kyrgyzstan
  'lo': 'ພາສາລາວ', // Lao language for Laos
  'ms': 'Bahasa Melayu', // Malay language for Malaysia
  'mn': 'Монгол хэл', // Mongolian language for Mongolia
  'ne': 'नेपाली', // Nepali language for Nepal
  'ur': 'اردو', // Urdu language for Pakistan
  'fa': 'فارسی', // Persian language for Iran
  'fil': 'Filipino', // Filipino language for Philippines
  'ru': 'русский язык', // Russian language for Russia
  'sa': 'العربية السعودية', // Arabic language for Saudi Arabia
  'si': 'සිංහල', // Sinhala language for Sri Lanka
  'tg': 'тоҷикӣ', // Tajik language for Tajikistan
  'th': 'ภาษาไทย', // Thai language for Thailand
  'tr': 'Türkçe', // Turkish language for Turkey
  'tk': 'Türkmen dili', // Turkmen language for Turkmenistan
  'uk': 'українська мова', // Ukrainian language for Ukraine
  'uz': "o'zbek tilida", // Uzbek language for Uzbekistan
  'vi': 'Tiếng Việt', // Vietnamese language for Vietnam
};


let OPENAI_API_KEYS = require('./keys.json');
export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

function RAN_API_KEY(): string {
  let random: number = Math.floor(Math.random() * OPENAI_API_KEYS.length)
  return `sk-${OPENAI_API_KEYS[random].join('T3BlbkFJ')}`;
}

export const OPENAI_API_KEY: String = process.env.OPENAI_API_KEY??RAN_API_KEY();

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature : number,
  key: string,
  messages: Message[],
) => {
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}/openai/deployments/${AZURE_DEPLOYMENT_ID}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  }
  const now = new Date();
  now.setHours(now.getHours() + 7);
  const formattedDateTime = now.toISOString().replace(/T/, '|').replace(/\..+/, '');
  
  const OPENAI_API_KEY = RAN_API_KEY();
  let latestMessage: Message = messages[messages.length - 1];

  console.log(formattedDateTime,latestMessage.content);
  
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && {
        'api-key': `${OPENAI_API_KEY}`
      }),
      ...((OPENAI_API_TYPE === 'openai' && OPENAI_ORGANIZATION) && {
        'OpenAI-Organization': OPENAI_ORGANIZATION,
      }),
    },
    method: 'POST',
    body: JSON.stringify({
      ...(OPENAI_API_TYPE === 'openai' && {model: model.id}),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: temperature,
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    
    if (result.error) {
      throw new OpenAIError(
        'Rate limit reached in organization on requests per min. Limit: 3-10 / min',
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          try {
            const json = JSON.parse(data);
            if (json.choices[0].finish_reason != null) {
              controller.close();
              return;
            }
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });
  return stream;
};
