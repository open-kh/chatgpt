import { IconPlus } from '@tabler/icons-react';
import { FC } from 'react';

import { Conversation } from '@/types/chat';

interface Props {
  selectedConversation: Conversation;
  onNewConversation: () => void;
}

export const Navbar: FC<Props> = ({
  selectedConversation,
  onNewConversation,
}) => {
  return (
    <nav className="flex w-full justify-between pt-3 py-3 px-4 z-20 text-gray-800 dark:text-white">
      <div className="mr-4"></div>

      <div className="max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap">
        {selectedConversation.name}
      </div>

      <IconPlus
        className="cursor-pointer hover:text-neutral-400 mr-8 max-sm:mr-1"
        onClick={onNewConversation}
      />
    </nav>
  );
};
