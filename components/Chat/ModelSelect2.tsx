import {
  Radio,
  Card,
  List,
  ListItem,
  ListItemPrefix,
  Typography,
} from "@material-tailwind/react";
import HomeContext from "@/pages/api/home/home.context";
import { JSXElementConstructor, Key, ReactElement, ReactFragment, ReactPortal, useContext } from "react";
import { getSettings, saveSettings } from "@/utils/app/settings";
import { model_names, models } from "../Them";
 
export default function RadioHorizontalList() {
  const {
    state: {service},
    handleUpdateConversation,
    dispatch
  } = useContext(HomeContext);

  const handleChange = (key: string) => {
    let settings = getSettings();
        settings.service = key;
        dispatch({
          field: 'service',
          value: settings.service,
        });
        saveSettings(settings);
  }
  return (
    <Card className="relative max-w-[20rem] rounded-xl overflow-scroll bg-white text-gray-900 dark:bg-gray-900">
      <List className="flex-row snap-x w-[27rem] mx:auto">
        {model_names.map((e: { id: any; name: any }) =>{
          return <ListItem className="p-0 w-auto flex snap-center" key={e.id} onClick={()=>handleChange(e.id)}>
              <label
                htmlFor="horizontal-list-react"
                className={`flex cursor-pointer rounded-md justify-center items-center px-3 py-2 text-gray-300 hover:text-gray-400 `+(service === e.id&&'bg-[#4e4f61] dark:text-white w-[230px]')}
              >
                {/* <ListItemPrefix className="mr-0">
                  {models[e.id]}
                </ListItemPrefix> */}
                  
                  <div className={`group/item text-center`}>
                    <div className="flex group-hover/item:-ml-1.5 group-hover/item:w-full">
                      <div className={"invisible w-0 group-hover/item:w-6 group-hover/item:visible"}>{models[e.id]}</div>
                      <Typography color="blue-gray" className={"font-medium group-hover/item:font-mono"}>
                        <code>{e.name}</code>
                      </Typography>
                    </div>
                  </div>
              </label>
            </ListItem>
        })}
      </List>
    </Card>
  );
}