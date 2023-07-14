import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';

import { HfInference } from '@huggingface/inference';
import { HuggingFaceStream, StreamingTextResponse } from 'ai';

// Create a new HuggingFace Inference instance
const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';
// Build a prompt from the messages
function buildPompt(
  messages: { content: string; role: 'system' | 'user' | 'assistant' }[],
) {
  return (
    messages
      .map(({ content, role }) => {
        if (role == 'system') {
          // return `<|system|>${content}<|system|>`
          return `<|prefix_begin|>${content}<|prefix_end|>`;
        } else if (role === 'user') {
          return `<|prompter|>${content}<|endoftext|>`;
        } else {
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
    // model: 'OpenAssistant/oasst-sft-6-llama-30b-xor',
    // model: 'tiiuae/falcon-7b-instruct',
    model: 'OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5',
    // model: 'OpenAssistant/oasst-sft-6-llama-30b-xor',
    inputs: buildPompt([
      {
        role: 'system',
        content: DEFAULT_SYSTEM_PROMPT,
      },
      ...messages,
    ]),
    parameters: {
      temperature: 0.7, 
      truncate: 1000, 
      max_new_tokens: 1024, 
      // stop: `[</s>]`,
      top_k:50,
      top_p: 0.95,
    },
  });

  // Convert the response into a friendly text-stream
  const stream = HuggingFaceStream(response);
  return new StreamingTextResponse(stream);
}
