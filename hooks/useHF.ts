import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';

import { HfInference } from '@huggingface/inference';
import { HuggingFaceStream, StreamingTextResponse } from 'ai';

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
          return `<|assistant|>${content}<|endoftext|>`;
        }
      })
      .join('') + '<|assistant|>'
  );
}

export async function POST(
  messages: { content: string; role: 'system' | 'user' | 'assistant' }[],
) {
  // Extract the `messages` from the body of the request
  const response = await Hf.textGenerationStream({
    // model: 'tiiuae/falcon-7b-instruct',
    // model: 'upstage/Llama-2-70b-instruct-v2',
    // model: 'meta-llama/Llama-2-7b-chat-hf',
    model: 'OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5',
    // model: 'OpenAssistant/oasst-sft-6-llama-30b',
    // model: 'CarperAI/stable-vicuna-13b-delta',
    // model: 'OpenAssistant/oasst-sft-6-llama-30b-xor',
    inputs: buildPompt([
      {
        role: 'system',
        content: DEFAULT_SYSTEM_PROMPT_V2,
      },
      ...messages,
    ]),
    parameters: {
      temperature: 0.1, 
      truncate: 1000, 
      max_new_tokens: 1024, 
      // stop: `[</s>]`,
      repetition_penalty:	1.2,
      return_full_text:	false,
      top_k:50,
      top_p: 0.95,
    },
  });

  // Convert the response into a friendly text-stream
  const stream = HuggingFaceStream(response);
  return new StreamingTextResponse(stream);
}
