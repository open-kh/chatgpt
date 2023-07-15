import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';

import { OpenAIStream, StreamingTextResponse } from 'ai';

export const runtime = 'edge';

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

const PROMPT = process.env.DEFAULT_SYSTEM_PROMPT;

export async function POST(
  messages: { content: string; role: 'system' | 'user' | 'assistant' }[],
  stream: true,
  model?: string 
) {
  // let url = `http://192.168.105.105:1337/chat/completions`;
  let url = `https://api.openkh.org/chat/completions`;
  // let url = `https://free.easychat.work/api/openai/v1/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: PROMPT },
        ...messages,
      ],
      // model: model??'gpt-3.5-turbo',
      stream,
    }),
  });

  const streamRes = OpenAIStream(res);

  return new StreamingTextResponse(streamRes);
}
