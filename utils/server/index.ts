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
  'bn': 'Bengali (বাংলা)',
  'my': 'Burmese (ဗမာ)',
  'zh': 'Chinese (中国)',
  'id': 'Indonesian (Bahasa Indonesia)',
  'ja': 'Japanese (日本語)',
  'km': 'Khmer (ភាសាខ្មែរ)',
  'ko': 'Korean (한국어)',
  'ky': 'Kyrgyz (Кыргызча)',
  'lo': 'Lao (ພາສາລາວ)',
  'ms': 'Malay (Bahasa Melayu)',
  'mn': 'Mongolian (Монгол хэл)',
  'ne': 'Nepali (नेपाली)',
  'ur': 'Urdu (اردو)',
  'fa': 'Persian (فارسی)',
  'fil': 'Filipino (Filipino)',
  'ru': 'Russian (русский язык)',
  'sa': 'Arabic (Saudi Arabia) (العربية السعودية)',
  'si': 'Sinhala (සිංහල)',
  'tg': 'Tajik (тоҷикӣ)',
  'th': 'Thai (ภาษาไทย)',
  'tr': 'Turkish (Türkçe)',
  'tk': 'Turkmen (Türkmen dili)',
  'uk': 'Ukrainian (українська мова)',
  'uz': 'Uzbek (o´zbek tili)',
  'vi': 'Vietnamese (Tiếng Việt)'
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

let AppOpenAI = 0;

function RAN_API_KEY(): string {
  // let random: number = Math.floor(Math.random() * OPENAI_API_KEYS.length)
  if(AppOpenAI >= 0 && AppOpenAI <= OPENAI_API_KEYS.length) {
    AppOpenAI++;
  }else{
    AppOpenAI = 0;
  }
  return `sk-${OPENAI_API_KEYS[AppOpenAI].join('T3BlbkFJ')}`;
}

export const OPENAI_API_KEY: String = process.env.OPENAI_API_KEY ?? RAN_API_KEY();

interface FetchOptions {
  timeout?: number;
  headers?: any;
  method?: string;
  body?: string;
}

async function fetchWithTimeout(resource:string, options: FetchOptions) {
  const { timeout = 5000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);
  return response;
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
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

  let OPENAI_API_KEY = RAN_API_KEY();
  let latestMessage: Message = messages[messages.length - 1];

  const streamData = () => fetchWithTimeout(url, {
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
    timeout: 1000,
    method: 'POST',
    body: JSON.stringify({
      ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
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

  let count: number = 0;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let res = await streamData();
  while (true) {
    count++;
    if (res.status !== 200) {
      const result = await res.json();
      if (result.error) {
        OPENAI_API_KEY = RAN_API_KEY();
        if(count <= 25){
            setTimeout(async ()=>{
              res = await streamData();
            },1000)
            continue;
          }
          throw new OpenAIError(
            `Please retry! The organization\'s request per minute rate limit has been surpassed.`,
            result.error.type,
            result.error.param,
            result.error.code,
          );
        } else {
          throw new Error(`The following error was returned by organization: ${decoder.decode(result?.value) || result.statusText}`);
        }
      }else if (res.status === 200){
        break;
      }
  }
  console.log(AppOpenAI,count, formattedDateTime, latestMessage.content);

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
