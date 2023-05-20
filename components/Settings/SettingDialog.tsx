import { FC, useContext, useEffect, useReducer, useRef } from 'react';

import { useTranslation } from 'next-i18next';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import { getSettings, saveSettings } from '@/utils/app/settings';

import { Settings } from '@/types/settings';

import HomeContext from '@/pages/api/home/home.context';
import { ModelSelect } from '../Chat/ModelSelect';
import { ClearConversations } from '../Chatbar/components/ClearConversations';
import { Import } from './Import';
import { SidebarButton } from '../Sidebar/SidebarButton';
import { IconFileExport } from '@tabler/icons-react';
import ChatbarContext from '../Chatbar/Chatbar.context';
import { TemperatureSlider } from '../Chat/Temperature';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SettingDialog: FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation('settings');
  const settings: Settings = getSettings();
  const { state, dispatch } = useCreateReducer<Settings>({
    initialState: settings,
  });
  const { state: {
    conversations,
    selectedConversation,
  },dispatch: homeDispatch,handleUpdateConversation } = useContext(HomeContext);
  const {
    handleClearConversations,
    handleImportConversations,
    handleExportData,
  } = useContext(ChatbarContext);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        window.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener('mouseup', handleMouseUp);
      onClose();
    };

    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose]);

  const handleSave = () => {
    homeDispatch({ field: 'lightMode', value: state.theme });
    saveSettings(state);
  };

  // Render nothing if the dialog is not open.
  if (!open) {
    return <></>;
  }

  // Render the dialog.
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          />

          <div
            ref={modalRef}
            //sm:max-h-[600px]
            className="inline-block flex-col gap-2 transform overflow-y-auto rounded-3xl border px-4 pt-5 pb-4 align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle bg-gray-800 text-left"
            role="dialog"
          >

            <div className="text-lg pb-4 font-bold text-neutral-200">
              {t('Settings')}
            </div>
            <div className='group relative py-2 px-4 pb-0 mb-2 rounded-lg border border-slate-700'>
              <div className="text-sm font-bold mb-2 text-neutral-200">
                {t('Datas')}
              </div>
              {conversations.length > 0 ? (
                <ClearConversations onClearConversations={handleClearConversations} />
              ) : null}

              <Import onImport={handleImportConversations} />

              <SidebarButton
                text={t('Export data')}
                icon={<IconFileExport size={18} />}
                onClick={() => handleExportData()}
              />
            </div>
            <div className='group relative py-2 px-4 pb-0 mb-2 rounded-lg border border-slate-700'>
              <ModelSelect />
              <TemperatureSlider
                  label={t('Temperature')}
                  onChangeTemperature={(temperature) =>
                    selectedConversation?.id && handleUpdateConversation(selectedConversation, {
                      key: 'temperature',
                      value: temperature,
                    })
                  }
                />
            </div>

            <div className='group relative py-2 px-4 mb-2 rounded-lg border border-slate-700'>
              <div className="text-sm font-bold mb-2 text-neutral-200">
                {t('Theme')}
              </div>
              <div
                className="w-full rounded-lg border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white"
                >
                <select
                className='w-full bg-transparent p-2'
                  value={state.theme}
                  onChange={(event) =>
                    dispatch({ field: 'theme', value: event.target.value })
                  }
                >
                  <option value="dark">{t('Dark mode')}</option>
                  <option value="light">{t('Light mode')}</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              className="w-full mt-3 rounded-3xl bg-gray-900 px-5 py-2 text-lg font-semibold border-neutral-200 uppercase text-gray-100 transition-colors hover:bg-gray-500"
              onClick={() => {
                handleSave();
                onClose();
              }}
            >
              {t('Update')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
