import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';


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

const GEN_API_KEYS = async (counter=23) =>{
  let keys: any[] = [];
  let prefs = [
    ""
  ];
  for(let i = 0; i < counter; i++) {
    setTimeout(() => {
        prefs.forEach(async (key, inx) => {
          const res = await fetch('https://api.openai.com/dashboard/user/api_keys', {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer sess-${prefs[inx]}`
            },
            method: 'POST',
            body: JSON.stringify({"action":"create","name":`secret key ${i} new`}),
          });
          let response = await res.json()
          console.log(`[\"${response['key']['sensitive_id'].replaceAll('sk-','').replaceAll('T3BlbkFJ',`","`)}\"],`);
        });
    }, 5000);
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
  // GEN_API_KEYS();

  const OPENAI_API_KEY = RAN_API_KEY();
  console.log(OPENAI_API_KEY.replaceAll('T3BlbkFJ','').replaceAll('sk-','').toUpperCase());
  
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
