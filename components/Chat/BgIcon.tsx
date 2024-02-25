import { memo, useContext, useState } from "react";
import HomeContext from "@/pages/api/home/home.context";
import { getSettings, saveSettings } from '@/utils/app/settings';

import { models } from "@/components/Them";

export const BgIcon = memo(()=>{
  const {
    state: {service}
  } = useContext(HomeContext);
  
  return (
    <div className=" w-full h-full">
      { models[service] }
    </div>
  )
})

BgIcon.displayName = 'BgIcon';