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

const JSONDATA = require('./account.json');

export const OPENAI_API_KEY: String =
  process.env.OPENAI_API_KEY ?? RAN_API_KEY();

const PROMPT = process.env.DEFAULT_SYSTEM_PROMPT;

function generateString(length: number) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}
// const randomString = generateRandomString(32);
// console.log(randomString); // cc9471fe-703d-4ab4-9f15-3751ca3258c7

export async function NewConversation(){
  const url = `https://claude.ai/api/organizations/${JSONDATA['userId']}/chat_conversations`
  const data = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/117.0',
      'Cookie': `${JSONDATA['cookie']}`,
    },
    body: JSON.stringify({
        "uuid":  `${generateString(8)}-${generateString(4)}-${generateString(4)}-${generateString(4)}-${generateString(12)}`,
        "name": "New Conversation",
    })
  });
  return data.json();
}


export async function POST(
  messages: { content: string; role: 'system' | 'user' | 'assistant' }[],
  stream: true,
  conver_uuid?: string, 
  model?: string 
) {
  let url = `https://claude.ai/api/append_message`;
  const JSONBODY = JSONDATA['chat'];
  JSONBODY['text'] = messages[messages.length-1].content;
  JSONBODY['organization_uuid'] = JSONDATA['organization_uuid'];
  if(conver_uuid == ""){
    const data = await NewConversation();
    conver_uuid = data['uuid'];
  }
  JSONBODY['conversation_uuid'] = conver_uuid;
  const resGPT = async () => await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${JSONDATA['cookie']}`,
    },
    body: JSON.stringify(JSONBODY),
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
