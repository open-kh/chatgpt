import { memo, useContext, useState } from "react";
import { IconBard, IconClaude, IconFacebook, IconMeta, IconOpenAI } from "../ui/icons";
import HomeContext from "@/pages/api/home/home.context";
import { getSettings, saveSettings } from '@/utils/app/settings';


const models:any = {
  meta: <IconMeta className="mx-auto w-5 h-5 pt-1" />,
  openai: <IconOpenAI className="mx-auto text-green-400 w-5 h-5" />,
  // claude: <IconClaude className="mx-auto w-6 h-6 -mt-0.5" />,
  bard: <IconBard className="mx-auto w-8 h-8" />,
}

export const ChatIcon = memo(()=>{
  const {
    state: {service},
    dispatch
  } = useContext(HomeContext);
  const modelNames = Object.keys(models);
  const [state, setState] = useState(0);
  
  let settings = getSettings();
  const handleClick = () => {
    setState(state + 1);
    if (state >= modelNames.length){
      setState(1)
    };
    settings.service = modelNames[state-1];
    dispatch({
      field: 'service',
      value: settings.service,
    });
    saveSettings(settings);
  }
  
  return (
    <div onClick={handleClick} className="cursor-pointer">
      { models[service] }
    </div>
  )
})

ChatIcon.displayName = 'ChatIcon';