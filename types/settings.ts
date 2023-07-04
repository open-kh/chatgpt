export interface Settings {
  theme: 'light' | 'dark';
  language: string | undefined;
  service: 'openai' | 'facebook' | 'other' | string;
}
