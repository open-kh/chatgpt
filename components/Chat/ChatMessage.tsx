import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconRobot,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { FC, memo, useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { updateConversation } from '@/utils/app/conversation';

import { Message } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import Btn from '../Buttons/Btn';
import Logo from '../Logo';
import { CodeBlock } from '../Markdown/CodeBlock';
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown';
import { IconOpenAI } from '../ui/icons';
import Wave from './Wave';

import rehypeMathjax from 'rehype-mathjax';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

export interface Props {
  message: Message;
  messageIndex: number;
  onEdit?: (editedMessage: Message) => void;
}

export const ChatMessage: FC<Props> = memo(
  ({ message, messageIndex, onEdit }) => {
    const { t } = useTranslation('chat');

    const {
      state: {
        selectedConversation,
        conversations,
        currentMessage,
        messageIsStreaming,
      },
      dispatch: homeDispatch,
    } = useContext(HomeContext);

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [messageContent, setMessageContent] = useState(message.content);
    const [messagedCopied, setMessageCopied] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const toggleEditing = () => {
      setIsEditing(!isEditing);
    };

    const handleInputChange = (
      event: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setMessageContent(event.target.value);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    const handleEditMessage = () => {
      if (message.content != messageContent) {
        if (selectedConversation && onEdit) {
          onEdit({ ...message, content: messageContent });
        }
      }
      setIsEditing(false);
    };

    const handleDeleteMessage = () => {
      if (!selectedConversation) return;

      const { messages } = selectedConversation;
      const findIndex = messages.findIndex((elm) => elm === message);

      if (findIndex < 0) return;

      if (
        findIndex < messages.length - 1 &&
        messages[findIndex + 1].role === 'assistant'
      ) {
        messages.splice(findIndex, 2);
      } else {
        messages.splice(findIndex, 1);
      }
      const updatedConversation = {
        ...selectedConversation,
        messages,
      };

      const { single, all } = updateConversation(
        updatedConversation,
        conversations,
      );
      homeDispatch({ field: 'selectedConversation', value: single });
      homeDispatch({ field: 'conversations', value: all });
    };

    const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
        e.preventDefault();
        handleEditMessage();
      }
    };

    const copyOnClick = () => {
      if (!navigator.clipboard) return;

      navigator.clipboard.writeText(message.content).then(() => {
        setMessageCopied(true);
        setTimeout(() => {
          setMessageCopied(false);
        }, 2000);
      });
    };

    useEffect(() => {
      setMessageContent(message.content);
    }, [message.content]);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [isEditing]);

    let styleEl = 'rounded-xl py-2 prose-pre:my-2 ';
    // styleEl += styleEl+' xl:w-full'
    return (
      <div
        className={`group max-sm:px-2 ${
          message.role === 'user'
            ? 'dark:bg-[#444654] dark:text-neutral-200'
            : ''
        }`}
        style={{ overflowWrap: 'anywhere' }}
      >
        <div className="mx-auto flex py-2 min-h-[calc(2rem+theme(spacing[3.5]))] md:max-w-xl lg:max-w-xl lg:px-0 xl:max-w-2xl">
          <div className="min-w-[40px] text-right">
            {message.role === 'user' ? (
              <div className="shadow-md text-center py-1.5 rounded-md w-[30px] h-[30px]">
                <IconUser className="mx-auto" />
              </div>
            ) : (
              <div className="shadow-md text-center py-1.5 mt-2 rounded-md w-[30px] h-[30px]">
                <IconOpenAI className="mx-auto" width={35} height={35} />
              </div>
            )}
          </div>
          <div
            className={
              message.role === 'assistant' ? styleEl : styleEl + 'left-0'
            }
          >
            {message.role === 'user' ? (
              <div className="flex w-full">
                {isEditing ? (
                  <div className="flex w-full flex-col">
                    <textarea
                      ref={textareaRef}
                      className="whitespace-pre-wrap rounded-lg dark:bg-gray-100 dark:text-gray-400"
                      value={messageContent}
                      onChange={handleInputChange}
                      onKeyDown={handlePressEnter}
                      onCompositionStart={() => setIsTyping(true)}
                      onCompositionEnd={() => setIsTyping(false)}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        padding: '0',
                        margin: '0',
                        overflow: 'hidden',
                      }}
                    />

                    <div className="mt-5 flex justify-center">
                      <Btn
                        onClick={handleEditMessage}
                        className="dark:bg-gray-800"
                        disabled={messageContent.trim().length <= 0}
                      >
                        {t('Update')}
                      </Btn>
                      <Btn
                        className="bg-gray-300"
                        disabled={messageContent.trim().length <= 0}
                        onClick={() => {
                          setMessageContent(message.content);
                          setIsEditing(false);
                        }}
                      >
                        {t('Cancel')}
                      </Btn>
                    </div>
                  </div>
                ) : (
                  <div className="prose whitespace-pre-wrap dark:prose-invert flex-1 sm:text-sm">
                    {message.content}
                  </div>
                )}

                {!isEditing && (
                  <div className="absolute -left-[40px] -top-1 items-center md:items-start justify-end md:justify-start">
                    <div className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border border-slate-700 rounded-md invisible group-hover:visible focus:visible flex flex-col gap-1">
                      <button className="" onClick={toggleEditing}>
                        <IconEdit size={17} />
                      </button>
                      <hr />
                      <button
                        className="text-purple-300"
                        onClick={handleDeleteMessage}
                      >
                        <IconTrash size={17} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-row w-full py-2">
                <MemoizedReactMarkdown
                  className="prose text-base dark:prose-invert w-full flex-1 sm:text-sm"
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeMathjax]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      if (children.length) {
                        if (children[0] == '▍') {
                          return (
                            <span className="animate-pulse cursor-default mt-1">
                              ▍
                            </span>
                          );
                        }

                        children[0] = (children[0] as string).replace(
                          '`▍`',
                          '▍',
                        );
                      }

                      const match = /language-(\w+)/.exec(className || '');

                      return !inline ? (
                        <CodeBlock
                          key={Math.random()}
                          language={(match && match[1]) || ''}
                          value={String(children).replace(/\n$/, '')}
                          {...props}
                        />
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return (
                        <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                          {children}
                        </table>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="break-words border border-black px-3 py-1 dark:border-white">
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {`${message.content}${
                    messageIsStreaming &&
                    messageIndex ==
                      (selectedConversation?.messages.length ?? 0) - 1
                      ? '`▍`'
                      : ''
                  }`}
                </MemoizedReactMarkdown>
                <div className="absolute invisible group-hover:visible focus:visible border border-slate-400 dark:border-slate-700 rounded-xl bottom-1.5 right-2 flex flex-col md:flex-row gap-4 md:gap-1 items-center md:items-start justify-end md:justify-start">
                  {messagedCopied ? (
                    <button className="p-1 text-green-500 dark:text-green-400">
                      <IconCheck size={20} />
                    </button>
                  ) : (
                    <button
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={copyOnClick}
                    >
                      <IconCopy size={20} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
ChatMessage.displayName = 'ChatMessage';
