import {
  IconColorFilter,
  IconFileExport,
  IconSettings,
} from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { getSettings, saveSettings } from '@/utils/app/settings';

import HomeContext from '@/pages/api/home/home.context';

import SelectLang from '@/components/Select';
import { SettingDialog } from '@/components/Settings/SettingDialog';

import { Import } from '../../Settings/Import';
import { Key } from '../../Settings/Key';
import { SidebarButton } from '../../Sidebar/SidebarButton';
import ChatbarContext from '../Chatbar.context';
import { ClearConversations } from './ClearConversations';
import { PluginKeys } from './PluginKeys';

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar');
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false);
  const [serviceSelected, setServiceSelected] = useState<string>('openai');

  const {
    state: { service,apiKey, serverSideApiKeyIsSet, serverSidePluginKeysSet },
    dispatch,
  } = useContext(HomeContext);

  useEffect(() => {
    const settings = getSettings()
    dispatch({
      field: 'service',
      value: settings.service
    })
    setServiceSelected(settings.service);
  }, [service]);

  const { handleApiKeyChange } = useContext(ChatbarContext);

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-md">
      <div className="w-full rounded-lg border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:text-white">
        <select
          className="w-full cursor-pointer text-gray-400 bg-transparent p-2 uppercase"
          placeholder={t('Select a model') || ''}
          value={serviceSelected}
          onChange={(e) => {
            let settings = getSettings();
            settings.service = `${e.target.value}`;
            dispatch({
              field: 'service',
              value: settings.service,
            });
            saveSettings(settings);
          }}
        >
          {['openai', 'facebook'].map((model) => (
            <option
              key={model}
              value={model}
              className="bg-[#343541] text-white"
            >
              Service {model}
            </option>
          ))}
        </select>
      </div>
      {/* <SelectLang /> */}
      <SidebarButton
        text={t('Themes')}
        icon={<IconColorFilter size={18} />}
        onClick={() => {
          let settings = getSettings();
          settings.theme = settings.theme == 'dark' ? 'light' : 'dark';
          dispatch({
            field: 'lightMode',
            value: settings.theme,
          });
          saveSettings(settings);
        }}
      />
      <SidebarButton
        text={t('Settings')}
        icon={<IconSettings size={18} />}
        onClick={() => setIsSettingDialog(true)}
      />

      {!serverSideApiKeyIsSet ? (
        <Key apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
      ) : null}

      {!serverSidePluginKeysSet ? <PluginKeys /> : null}

      <SettingDialog
        open={isSettingDialogOpen}
        onClose={() => {
          setIsSettingDialog(false);
        }}
      />
    </div>
  );
};
