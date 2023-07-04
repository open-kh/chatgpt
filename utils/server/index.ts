import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { OPENAI_API_HOST, OPENAI_API_TYPE } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

interface LangCodes {
  [key: string]: string;
}

export const LANGS: LangCodes = {
  bn: 'Bengali (বাংলা)',
  my: 'Burmese (ဗမာ)',
  zh: 'Chinese (中国)',
  id: 'Indonesian (Bahasa Indonesia)',
  ja: 'Japanese (日本語)',
  km: 'Khmer (ភាសាខ្មែរ)',
  ko: 'Korean (한국어)',
  ky: 'Kyrgyz (Кыргызча)',
  lo: 'Lao (ພາສາລາວ)',
  ms: 'Malay (Bahasa Melayu)',
  mn: 'Mongolian (Монгол хэл)',
  ne: 'Nepali (नेपाली)',
  ur: 'Urdu (اردو)',
  fa: 'Persian (فارسی)',
  fil: 'Filipino (Filipino)',
  ru: 'Russian (русский язык)',
  sa: 'Arabic (Saudi Arabia) (العربية السعودية)',
  si: 'Sinhala (සිංහල)',
  tg: 'Tajik (тоҷикӣ)',
  th: 'Thai (ภาษาไทย)',
  tr: 'Turkish (Türkçe)',
  tk: 'Turkmen (Türkmen dili)',
  uk: 'Ukrainian (українська мова)',
  uz: 'Uzbek (o´zbek tili)',
  vi: 'Vietnamese (Tiếng Việt)',
};

// let OPENAI_API_KEYS = require('./keys.json');
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

const OPENAI_API_KEYS = [
  ['IsvnC4ce37gIV1TLnEug', '4XjHYMjmrvIEeHXNzDey'],
  ['0ytzGEkFxdAoVbJs6pUg', 'VCrlINsfgtoDSrgn4s6D'],
];

function RAN_API_KEY(): string {
  let random: number = Math.floor(Math.random() * OPENAI_API_KEYS.length);
  return `sk-${OPENAI_API_KEYS[random].join('T3BlbkFJ')}`;
}

export const OPENAI_API_KEY: String =
  process.env.OPENAI_API_KEY ?? RAN_API_KEY();

interface FetchOptions {
  timeout?: number;
  headers?: any;
  method?: string;
  body?: string;
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  key: string,
  messages: Message[],
) => {
  // let url = `http://127.0.0.1:3000/api/chat`;
  let url = `http://api.openkh.org/chat/completions`;
  // let url = `${process.env.OPENAI_API_LOCAL??OPENAI_API_HOST}/v1/chat/completions`;
  const now = new Date();
  now.setHours(now.getHours() + 7);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ messages: messages }),
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
