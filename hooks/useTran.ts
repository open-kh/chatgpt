export const translate = async (text: string, fromL?: string, toL?: string) => {
  let fL = fromL || 'en';
  let tL = toL || 'de';
  var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
            fL + "&tl=" + tL + "&dt=t&q=" + encodeURI(text);

  const parseJSON = (txt: string) => JSON.parse(txt.split(',').map(x => x || 'null').join(','));
  const joinSnippets = (json: any[]) => json[0].map((x: any[]) => x[0]).join('');
  
  try {
    const response = await fetch(url);
    const responseBody = await response.text();
    return joinSnippets(parseJSON(responseBody));
  } catch (reason) {
    console.log('Google Translate: ' + reason);
    throw reason;
  }
}
