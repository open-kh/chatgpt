import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';
import { OPENAI_API_KEY } from '@/utils/server';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const models: OpenAIModel[] = [{
        id: OpenAIModelID.GPT_3_5,
        name: 'GPT-3.5',
        maxLength: 12000,
        tokenLimit: 4000,
    }];
    return new Response(JSON.stringify(models), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
