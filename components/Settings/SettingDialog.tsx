import { FC, useContext, useEffect, useReducer, useRef } from 'react';

import { useTranslation } from 'next-i18next';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import { getSettings, saveSettings } from '@/utils/app/settings';

import { Settings } from '@/types/settings';

import HomeContext from '@/pages/api/home/home.context';
import { ModelSelect } from '../Chat/ModelSelect';

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
  const { dispatch: homeDispatch } = useContext(HomeContext);
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
            className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-3xl border border-gray-600 px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle bg-gradient-to-t from-gray-700 via-gray-600 to-gray-500 text-left"
            role="dialog"
          >
            <div className="text-lg pb-4 font-bold text-neutral-200">
              {t('Settings')}
            </div>
            <ModelSelect />

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
