import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';

import { HuggingFaceStream, OpenAIStream, StreamingTextResponse } from 'ai';
import { NextResponse } from 'next/server';

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

export async function POST(
  messages: string
) {
  let url = `https://api.openkh.org/chat/image_generation`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      text: messages
    }),
  });;
  return response;
  // const streamRes = OpenAIStream(response);
  // return new StreamingTextResponse(streamRes);
}
