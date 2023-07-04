import { memo, useContext } from "react";
import { IconFacebook, IconOpenAI } from "../ui/icons";
import HomeContext from "@/pages/api/home/home.context";

export const ChatIcon = memo(()=>{
  const {
    state: { service},
  } = useContext(HomeContext);
  return (service=='facebook'? <IconFacebook className="mx-auto text-blue-400 w-6 h-6" />
  :<IconOpenAI className="mx-auto text-green-400 w-5 h-5" />)
})

ChatIcon.displayName = 'ChatIcon';