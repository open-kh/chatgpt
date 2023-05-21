import { useContext, useEffect, useState } from 'react';

import { getSettings, saveSettings } from '@/utils/app/settings';
import { LANGS } from '@/utils/server';

import HomeContext from '@/pages/api/home/home.context';
import { getServerSideProps } from '@/pages';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function SelectLanguage(){
  let settings = getSettings();
  const [language, setLanguange] = useState(settings.language);
  const { dispatch } = useContext(HomeContext);
  settings.language = language;
  useEffect(() => {
    dispatch({
      field: 'language',
      value: language,
    });
    saveSettings(settings);
  }, [language]);
  return (
    <div className="w-full">
      <div className="mb-1 w-full rounded border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
        <select
          className="w-full cursor-pointer bg-transparent p-2"
          placeholder="Select a language"
          onChange={(e) => {
            setLanguange(e.target.value);
          }}
        >
          <option
            key="default"
            value="default"
            className="dark:bg-[#343541] dark:text-white"
          >
            Default
          </option>

          {Object.keys(LANGS).map((i) => (
            <option
              key={i}
              value={i}
              className="dark:bg-[#343541] dark:text-white"
              selected={i === language}
            >
              {LANGS[i]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
