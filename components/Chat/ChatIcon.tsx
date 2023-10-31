import { memo, useContext, useState } from "react";
import HomeContext from "@/pages/api/home/home.context";
import { getSettings, saveSettings } from '@/utils/app/settings';

import { models } from "@/components/Them";

export const ChatIcon = memo(()=>{
  const {
    state: {service, loading},
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