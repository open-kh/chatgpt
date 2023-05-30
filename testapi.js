// curl https://chatgpt-api.shn.hk/v1/ \
//   -H 'Content-Type: application/json' \
//   -d '{
//   "model": "gpt-3.5-turbo",
//   "messages": [{"role": "user", "content": "Hello, how are you?"}]
// }'

const url = 'https://chatgpt-api.shn.hk/v1/';

fetch(url, {
  'Content-Type': "application/json",
  
})