import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { OPENAI_API_KEY } from '@/utils/server';

import { HfInference } from '@huggingface/inference';
import { HuggingFaceStream,OpenAIStream, StreamingTextResponse } from 'ai';

// Create a new HuggingFace Inference instance
const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const DEFAULT_SYSTEM_PROMPT_V2="You are Open Brain, an AI managed by Mr. Phearum. Follow the user's instructions carefully. Markdown will be used to code respond."

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';
// Build a prompt from the messages
function buildPompt(
  messages: { content: string; role: 'system' | 'user' | 'assistant' }[],
  ) {
  let count = messages.length
  return (
    messages
      .map(({ content, role }) => {
        if (role == 'system') {
          // return `<|system|>${content}<|system|>`
          // content+='. You can use any emojis which related';
          return `<|prefix_begin|>${content}<|prefix_end|>`;
        } 
        if (role === 'user') {
          return `<|prompter|>${content}<|endoftext|>`;
        }else {
          return `<|response|>${content}<|endoftext|>`;
        }
      })
      .join('') + '<|response|>'
  );
}

export async function POST(
  messages: { content: string; role: 'system' | 'user' | 'assistant' }[],
) {
  // Extract the `messages` from the body of the request
  const resGPT = async () => await fetch(`${process.env.AI_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      messages: [{"content":buildPompt([
        {
          role: 'system',
          content: DEFAULT_SYSTEM_PROMPT_V2,
        },
        ...messages,
      ])}],
      model: 'llama-2-70b',
      stream: true,
    }),
  });
  let res = await resGPT();
  const streamRes = OpenAIStream(res);
  return new StreamingTextResponse(streamRes);

  // const response = await Hf.textGenerationStream({
  //   model: 'meta-llama/Llama-2-70b-chat-hf',
    // inputs: buildPompt([
    //   {
    //     role: 'system',
    //     content: DEFAULT_SYSTEM_PROMPT_V2,
    //   },
    //   ...messages,
    // ]),
  //   parameters: {
  //     temperature: 0.1, 
  //     truncate: 1000, 
  //     max_new_tokens: 1024, 
  //     // stop: `[</s>]`,
  //     repetition_penalty:	1.2,
  //     return_full_text:	false,
  //     top_k:50,
  //     top_p: 0.95,
  //   },
  // });

  // // Convert the response into a friendly text-stream
  // const stream = HuggingFaceStream(response);
  // return new StreamingTextResponse(stream);
}
