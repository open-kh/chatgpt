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
  let url = `https://api.openkh.org/chat/completions`;
  // let url = `http://0.0.0.0:1337/chat/completions`;
  // model = 'falcon-40b';
  // let url = `https://free.easychat.work/api/openai/v1/chat/completions`;
  const resGPT = async () => await fetch(url, {
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
      model: model??'falcon-40b',
      stream,
    }),
  });
  let res = await resGPT();
  
  if(res.body instanceof ReadableStream){
    res = res;
  }else{
    model = 'falcon-40b';
    res = await resGPT();
  }
  const streamRes = OpenAIStream(res);

  return new StreamingTextResponse(streamRes);
}
