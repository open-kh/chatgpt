import { memo, useContext } from "react";
import { IconFacebook, IconMeta, IconOpenAI } from "../ui/icons";
import HomeContext from "@/pages/api/home/home.context";
import { getSettings, saveSettings } from '@/utils/app/settings';


export const ChatIcon = memo(()=>{
  const {
    state: {service},
    dispatch
  } = useContext(HomeContext);
  return (
    <div onClick={(e) => {
        let settings = getSettings();
        settings.service = service=='meta'?'openai':'meta';
        dispatch({
          field: 'service',
          value: settings.service,
        });
        saveSettings(settings);
      }} className="cursor-pointer">
      {
        service=='meta'
        ?<IconMeta className="mx-auto w-5 h-5 pt-1" />
        :<IconOpenAI className="mx-auto text-green-400 w-5 h-5" />
      }
    </div>
  )
})

ChatIcon.displayName = 'ChatIcon';