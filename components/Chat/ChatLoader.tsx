import { FC } from 'react';
import Wave from './Wave';
import { IconOpenAI } from '../ui/icons';
import { ChatIcon } from './ChatIcon';

interface Props {}

export const ChatLoader: FC<Props> = () => {
  return (
    <div className="mx-auto py-2 min-h-[calc(2rem+theme(spacing[3.5]))] md:max-w-2xl lg:px-0">
      <span className='max-sm:pl-2.5 flex w-full'>
        <div className="shadow-md text-center py-1.5 mt-2 rounded-md w-[30px] h-[30px]">
          {/* <IconOpenAI className="mx-auto" width={35} height={35} /> */}
          <ChatIcon/>
        </div>
        <div className={'ml-3 mt-4 transition-all ease-in-out duration-900'} >
          <Wave />
        </div>
      </span>
    </div>
  );
};
ChatLoader.displayName = 'ChatLoader'