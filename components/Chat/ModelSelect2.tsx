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
    <Card className="relative w-full max-w-[15rem] dark:bg-gray-700 dark:text-white  shadow">
      <List className="flex-row">
        {[{name:'Meta',id: 'meta'}, {name: 'OpenAI',id: 'openai'}].map(e =>{
          return <ListItem className="p-0" key={e.id}>
              <label
                htmlFor="horizontal-list-react"
                onClick={()=>handleChange(e.id)}
                className={`flex w-full cursor-pointer rounded-md justify-center items-center px-3 py-2 `+(service === e.id&&'bg-slate-100 dark:text-black')}
              >
                {/* <ListItemPrefix className="mr-3">
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
                <Typography color="blue-gray" className="font-medium">
                  {e.name}
                </Typography>
              </label>
            </ListItem>
        })}
      </List>
    </Card>
  );
}