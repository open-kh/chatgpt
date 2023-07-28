import { memo, useContext } from "react";
import { IconFacebook, IconMeta, IconOpenAI } from "../ui/icons";
import HomeContext from "@/pages/api/home/home.context";

export const ChatIcon = memo(()=>{
  const {
    state: { service},
  } = useContext(HomeContext);
  return (
    service=='meta'
    ?<IconMeta className="mx-auto w-5 h-5 pt-1" />
    :<IconOpenAI className="mx-auto text-green-400 w-5 h-5" />
  )
})

ChatIcon.displayName = 'ChatIcon';