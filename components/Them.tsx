import Image from "next/image";
import { IconBing, IconClaude, IconMeta, IconOpenAI, IconPerplexity, IconSeaLLM } from "./ui/icons";
export default function Them() {
  return (
    <>
      <div className="relative flex w-full p-1 bg-n-6 rounded-xl before:absolute before:left-1 before:top-1 before:bottom-1 before:w-[calc(50%-0.25rem)] before:bg-n-7 before:rounded-[0.625rem] before:transition-all false">
        <button className="relative z-1 group flex justify-center items-center h-10 basis-1/2 base2 font-semibold transition-colors hover:text-n-1 text-n-1">
          <Image src="/public/icons/light.svg" alt={"Light Mode"} />
          Light
        </button>
        <button className="relative z-1 group flex justify-center items-center h-10 basis-1/2 base2 font-semibold text-n-4 transition-colors hover:text-n-1 false">
          <Image src="/public/icons/dark.svg" alt={"Dark Mode"} />
          Dark
        </button>
      </div>
    </>
  );
}


export const models:any = {
  bing: <IconBing className="mx-auto w-[16px] h-[16px] -mt-0.5" />,
  openai: <IconOpenAI className="mx-auto text-green-400 w-5 h-5" />,
  perplexity: <IconPerplexity className="mx-auto w-5 h-5 -mt-0.5" />,
  seallm: <IconSeaLLM className="mx-auto w-5 h-5" />,
  meta: <IconMeta className="mx-auto w-5 h-5 pt-1" />,
}

export const model_names: any = [
  {name:'SeaLLM',       id: 'seallm'},
  {name:'BingAI',       id: 'bing'},
  {name:'ChatGPT',      id: 'openai'}, 
  {name:'PerplexityAI', id: 'perplexity'},
  {name:'MetaAI',       id: 'meta'},
]