export const genterate = async (counter=23) =>{
  let keys: any[] = [];
  let prefs = [
    "uRztVF8LLESKFAaYFF16veNg4C0Did6JtpNNS8d9"
  ];
  for(let i = 0; i < counter; i++) {
    setTimeout(() => {
        prefs.forEach(async (key, inx) => {
          const res = await fetch('https://api.openai.com/dashboard/user/api_keys', {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer sess-${prefs[inx]}`
            },
            method: 'POST',
            body: JSON.stringify({"action":"create","name":`secret key ${i} new`}),
          });
          let response = await res.json()
          console.log(`[\"${response['key']['sensitive_id'].replaceAll('sk-','').replaceAll('T3BlbkFJ',`","`)}\"],`);
        });
    }, 5000);
  }
}