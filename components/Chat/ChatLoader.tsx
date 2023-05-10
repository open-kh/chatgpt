import { IconRobot } from '@tabler/icons-react';
import { FC } from 'react';
import Logo from '../Logo';
import Wave from './Wave';

interface Props { }

export const ChatLoader: FC<Props> = () => {
  let styleEl = 'relative mt-2.5 prose text-base min-h-[calc(2rem+theme(spacing[3.5]))] min-w-[100px] rounded-3xl px-5 py-3.5 border border-gray-100 bg-gradient-to-br from-gray-50 text-gray-600 prose-pre:my-2 dark:border-gray-800 dark:from-gray-800/40 dark:text-gray-300';
  return (
    <div className="m-auto flex text-base md:max-w-2xl lg:max-w-2xl xl:max-w-3xl">
      <div className="min-w-[40px] items-end">
        <Logo className='mt-5 w-[20px] h-[20px]'/>
      </div>
      <div className={styleEl+' mt-1'}>
        <Wave/>
      </div>
    </div>
  );
};
