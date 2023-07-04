import { IconRobot } from '@tabler/icons-react';
import { FC } from 'react';

import Image from 'next/image';

import Logo from '../Logo';
import Wave from './Wave';

interface Props {}

export const ChatLoader: FC<Props> = () => {
  let styleEl =
    'relative mt-2.5 text-base min-h-[calc(2rem+theme(spacing[3.5]))] min-w-[100px] rounded-3xl px-5 py-3.5 border border-gray-100 bg-gradient-to-br from-gray-50 text-gray-600 prose-pre:my-2 dark:border-gray-800 dark:from-gray-800/40 dark:text-gray-300';
  return (
    <div className="m-auto flex text-base md:max-w-2xl lg:max-w-2xl xl:max-w-3xl">
      <Image
        alt=""
        width={22}
        height={22}
        src="/loading.png"
        className="h-full flex-none select-none mt-6 mr-[1.2rem] max-sm:mr-2"
      />
      <div
        className={styleEl + ' mt-1 transition-all ease-in-out duration-900'}
      >
        <Wave />
      </div>
    </div>
  );
};
