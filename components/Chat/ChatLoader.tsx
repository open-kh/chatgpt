import { FC } from 'react';
import Wave from './Wave';
import { IconOpenAI } from '../ui/icons';

interface Props {}

export const ChatLoader: FC<Props> = () => {
  return (
    <div className="mx-auto flex py-2 min-h-[calc(2rem+theme(spacing[3.5]))] md:max-w-xl lg:max-w-xl lg:px-0 xl:max-w-2xl">
      <div className="shadow-md text-center py-1.5 mt-2 rounded-md w-[30px] h-[30px]">
        <IconOpenAI className="mx-auto" width={35} height={35} />
      </div>
      <div className={'ml-3 mt-4 transition-all ease-in-out duration-900'} >
        <Wave />
      </div>
    </div>
  );
};
ChatLoader.displayName = 'ChatLoader'