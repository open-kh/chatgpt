import { StringMap } from "i18next";

export const translate = async () => {
  var url = 'http://127.0.0.1:1337/chat/completions_translation'
  
  const response = await fetch(url);
  return response;
}
