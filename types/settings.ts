export interface Settings {
  theme: 'light' | 'dark';
  language: string | undefined;
  service: 'openai' | 'meta' | 'other' | string;
}
