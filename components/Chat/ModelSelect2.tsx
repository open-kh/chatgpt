import {
  Radio,
  Card,
  List,
  ListItem,
  ListItemPrefix,
  Typography,
} from "@material-tailwind/react";
import HomeContext from "@/pages/api/home/home.context";
import { useContext } from "react";
import { getSettings, saveSettings } from "@/utils/app/settings";
import { IconClaude, IconMeta, IconOpenAI } from "../ui/icons";

const models = {
  meta: <IconMeta className="mx-auto w-5 h-5 pt-1" />,
  openai: <IconOpenAI className="mx-auto text-green-400 w-5 h-5" />,
  claude: <IconClaude className="mx-auto w-6 h-6 -mt-0.5" />,
}
 
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
    <Card className="relative w-full max-w-[20rem] rounded-xl bg-white text-gray-900 dark:bg-gray-900">
      <List className="flex-row">
        {[
          {name:'Meta',id: 'meta'},
          {name: 'ChatGPT',id: 'openai'}, 
          {name: 'Bard',id: 'bard'}
        ].map(e =>{
          return <ListItem className="p-0" key={e.id}>
              <label
                htmlFor="horizontal-list-react"
                onClick={()=>handleChange(e.id)}
                className={`flex w-24 cursor-pointer rounded-md justify-center items-center px-3 py-2 text-gray-300 hover:text-gray-400 `+(service === e.id&&'bg-[#4e4f61] dark:text-white')}
              >
                {/* <ListItemPrefix className="mr-0">
                  <Radio
                    name="horizontal-list"
                    id="horizontal-list-react"
                    ripple={false}
                    className="hover:before:opacity-0"
                    containerProps={{
                      className: "p-0",
                    }}
                  />
                </ListItemPrefix> */}
                {/* <div className="flex w-28">
                  {models[e.id]}
                </div> */}
                  <Typography color="blue-gray" className="flex font-medium">
                    {e.name}
                  </Typography>
              </label>
            </ListItem>
        })}
      </List>
    </Card>
  );
}