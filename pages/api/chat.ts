import * as gpt from '@/hooks/useGPT';
import * as hf from '@/hooks/useHF';
import * as img from '@/hooks/useImage';
import * as tr from '@/hooks/useChatTran';

import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';

import { ChatBody, Message } from '@/types/chat';

// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';
import { NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const json = await req.json();
    const { model, messages, key, prompt, temperature } = json as ChatBody;
    const { service } = json;

    await init((imports) => WebAssembly.instantiate(wasm, imports));
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    );

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    let temperatureToUse = temperature;
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE;
    }

    const prompt_tokens = encoding.encode(promptToSend);

    let tokenCount = prompt_tokens.length;
    let messagesToSend: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encoding.encode(message.content);

      if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
        break;
      }
      tokenCount += tokens.length;
      messagesToSend = [message, ...messagesToSend];
    }
    encoding.free();

    let imageGen = messages[messages.length-1]['content'];
    const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFhZjI0ZTQ5LTFiMDUtNDBlMy1iMDU2LTFmM2FlYmViNzEyMCIsImlhdCI6MTY4OTQ5NjY3NCwiZXhwIjoxNjg5NzU1ODc0LCJhY3Rpb24iOiJhdXRoIiwiaXNzIjoidGhlYi5haSJ9.z5t72OxVK9xMxe8kC3huAqo6qPqkv92TG3SxqcGs0sg'
    if(imageGen.startsWith('/image')){
      var pattern = /--count=(\d+)/;
      const match: Array<string> | null = imageGen.match(pattern);
      imageGen = imageGen.replaceAll('/image','').trim()
      messages[messages.length-1]['content'] = imageGen
      let usechat = null;
      if (match) {
        imageGen = imageGen.replace(match[0],'').trim();
        messages[messages.length-1]['content'] = imageGen
        var count = parseInt(match[1], 10);
        usechat = await img.POST(imageGen, count=count)
      }
      usechat = await img.POST(imageGen)
      return usechat
    }else if(imageGen.startsWith('/trans')){
      // imageGen = imageGen.replaceAll('/trans','').trim()
      // messages[messages.length-1]['content'] = imageGen
      const usechat = await tr.translate()
      return usechat
    }
    messages[messages.length-1]['content'] = imageGen.replaceAll('/chat','').trim()

    if (service == 'meta') {
      const usechat = await hf.POST(messagesToSend);
      return usechat;
    }else if(service == 'trans') {
      const usechat = await tr.translate();
      return usechat;
    } else {
      const usechat = await gpt.POST(messagesToSend, true, service);
      return usechat;
    }

    const stream = await OpenAIStream(
      model,
      promptToSend,
      temperatureToUse,
      key,
      messagesToSend,
    );
    return new Response(stream);
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;
