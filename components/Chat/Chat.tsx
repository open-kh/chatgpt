import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';
import Image from 'next/image';

import { getEndpoint } from '@/utils/app/api';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { getSettings, saveSettings } from '@/utils/app/settings';
import { throttle } from '@/utils/data/throttle';
import { LANGS } from '@/utils/server';

import { ChatBody, Conversation, Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';
import { Settings } from '@/types/settings';

import HomeContext from '@/pages/api/home/home.context';

import Instanse from '../Instanse';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ChatMode } from './ChatMod';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { MemoizedChatMessage } from './MemoizedChatMessage';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');
  const {
    state: {
      appName,
      selectedConversation,
      conversations,
      apiKey,
      service,
      pluginKeys,
      serverSideApiKeyIsSet,
      modelError,
      loading,
      language,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  let settings: Settings;
  useEffect(() => {
    settings = getSettings();
    homeDispatch({
      field: 'service',
      value: settings.service,
    });
  }, [service]);

  const handleSend = useCallback(
    async (message: Message, deleteCount = 0, plugin: Plugin | null = null) => {
      const transitions: string =
        language === 'default'
          ? ''
          : ` Answer must be ${LANGS[language]} language.`;
      // console.log(transitions);
      if (selectedConversation) {
        let updatedConversation: Conversation;
        if (deleteCount) {
          const updatedMessages = [...selectedConversation.messages];
          for (let i = 0; i < deleteCount; i++) {
            updatedMessages.pop();
          }
          updatedConversation = {
            ...selectedConversation,
            messages: [...updatedMessages, message],
          };
        } else {
          updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
          };
        }
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
        homeDispatch({ field: 'loading', value: true });
        homeDispatch({ field: 'messageIsStreaming', value: true });
        const chatBody: ChatBody = {
          model: updatedConversation.model,
          messages: updatedConversation.messages,
          key: apiKey,
          prompt: updatedConversation.prompt + transitions,
          temperature: updatedConversation.temperature,
        };
        const endpoint = getEndpoint(plugin);
        const settings = getSettings();
        let body;
        if (!plugin) {
          body = JSON.stringify({ ...chatBody, service: settings.service });
        } else {
          body = JSON.stringify({
            ...chatBody,
            service: settings.service,
            // googleAPIKey: pluginKeys
            //   .find((key) => key.pluginId === 'google-search')
            //   ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value,
            // googleCSEId: pluginKeys
            //   .find((key) => key.pluginId === 'google-search')
            //   ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value,
          });
        }

        const controller = new AbortController();
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body,
        });
        if (!response.ok) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          toast.error(response.statusText);
          return;
        }
        const data = response.body;

        if (!data) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          return;
        }
        if (!plugin) {
          if (updatedConversation.messages.length === 1) {
            const { content } = message;
            const customName =
              content.length > 30 ? content.substring(0, 30) + '...' : content;
            updatedConversation = {
              ...updatedConversation,
              name: customName,
            };
          }

          homeDispatch({ field: 'loading', value: false });
          const reader = data.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let isFirst = true;
          let text = '';
          while (!done) {
            if (stopConversationRef.current === true) {
              controller.abort();
              done = true;
              break;
            }
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);
            text += chunkValue;
            if (isFirst) {
              isFirst = false;
              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                { role: 'assistant', content: chunkValue },
              ];
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };

              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            } else {
              const updatedMessages: Message[] =
                updatedConversation.messages.map((message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: text,
                    };
                  }
                  return message;
                });
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            }
          }
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation;
              }
              return conversation;
            },
          );
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'messageIsStreaming', value: false });
        } else {
          const { answer } = await response.json();
          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: answer },
          ];
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };
          homeDispatch({
            field: 'selectedConversation',
            value: updateConversation,
          });
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation;
              }
              return conversation;
            },
          );
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
        }
      }
    },
    [
      apiKey,
      conversations,
      pluginKeys,
      selectedConversation,
      stopConversationRef,
    ],
  );

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      });
    }
  };

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 250);

  // useEffect(() => {
  //   console.log('currentMessage', currentMessage);
  //   if (currentMessage) {
  //     handleSend(currentMessage);
  //     homeDispatch({ field: 'currentMessage', value: undefined });
  //   }
  // }, [currentMessage]);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      );
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  const messages = [
    {
      title: '"How do I make an HTTP request in Javascript?"',
      body: 'How do I make an HTTP request in Javascript?',
    },
    {
      title: '"Write an email from bullet list"',
      body: 'As a restaurant owner, write a professional email to the supplier to get these products every week: \n\n- Wine (x10)\n- Eggs (x24)\n- Bread (x12)',
    },
    {
      title: '"Got any creative ideas for a 10 year old\'s birthday?"',
      body: "Got any creative ideas for a 10 year old's birthday?",
    },
  ];
  // return <div className="relative flex-1 justify-center overflow-hidden bg-white dark:bg-[#343541]">
  //   <div className='max-sm:max-h-[730px] absolute top-[20%] left-[30%] w-[40%] overflow-x-hidden'>
  //     <ChatMode/>
  //   </div>
  // </div>;
  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {!(apiKey || serverSideApiKeyIsSet) ? (
        <></>
      ) : modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {selectedConversation?.messages.length === 0 ? (
              <div className="max-sm:max-h-[730px]">
                <div className="mx-auto flex flex-col space-y-5 md:space-y-5 px-3 pt-5 md:pt-12 sm:max-w-[1200px]">
                  <p className="max-sm:hidden md:block text-bold font-medium text-3xl uppercase text-center py-10">
                    AI Chat
                  </p>
                  <div className="my-auto md:px-40 grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                      <div>
                        <div className="mb-3 flex items-end text-2xl font-semibold">
                          <Image
                            alt=""
                            width={45}
                            height={45}
                            src="/favicon.ico"
                            className="flex-none select-none"
                          />
                          {appName}
                        </div>
                        <p className="text-base text-gray-600 dark:text-gray-400">
                          Making the community`s best AI chat models available
                          to everyone.
                          <br />
                          Optimized conversation model, more natural and vivid language. Powered by OpenAI and HuggingFace.
                          <br />
                          <code>Dynamic model: 
                            {['Falcon 40b(on trading)', 'GPT-3.5-turbo(16k)', 'GPT-4(32k)'].map(model=>{
                              return <p key={model} className=' text-sm dark:text-white'>{model}</p>
                            })}
                          </code>
                        </p>
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <ChatMode />
                    </div>
                    <div className="lg:col-span-3 lg:mt-12">
                      <p className="mb-3 text-gray-600 dark:text-gray-300">
                        Examples
                      </p>
                      <div className="max-sm:mb-[150px]">
                        <div className="grid gap-3 lg:grid-cols-3 lg:gap-5">
                          {messages.map((m, i) => (
                            <button
                              key={i}
                              type="button"
                              title="Prefix Example"
                              className="rounded-2xl border bg-gray-50 p-2.5 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:p-4"
                              onClick={() => {
                                let message: Message = {
                                  role: 'user',
                                  content: m.body,
                                };
                                setCurrentMessage(message);
                                handleSend(message, 0, null);
                              }}
                            >
                              {m.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="sticky mb-1 bg-slate-50 max-sm:hidden flex hidden top-0 z-10 border justify-around py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200 max-sm:bg-transparent">
                  {/* <span className="uppercase w-full"></span> */}
                  <span className="uppercase  w-full text-center max-sm:hidden">
                    {selectedConversation?.name}
                  </span>
                  {/* <span className="uppercase text-end w-full pr-2">{`${service}`}</span> */}
                </div>
                <div className="">
                  {selectedConversation?.messages.map((message, index) => (
                    <MemoizedChatMessage
                      key={index}
                      message={message}
                      messageIndex={index}
                      onEdit={(editedMessage) => {
                        setCurrentMessage(editedMessage);
                        // discard edited message and the ones that come after then resend
                        handleSend(
                          editedMessage,
                          selectedConversation?.messages.length - index,
                        );
                      }}
                    />
                  ))}

                  {loading && <ChatLoader />}
                  {/* <ChatLoader /> */}

                  <div
                    className="h-[162px] bg-white dark:bg-[#343541]"
                    ref={messagesEndRef}
                  />
                </div>
              </>
            )}
          </div>
          {/* <Instanse slot={3884568135} client={5328097012407543} /> */}

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(message, plugin) => {
              setCurrentMessage(message);
              handleSend(message, 0, plugin);
            }}
            onScrollDownClick={handleScrollDown}
            onRegenerate={() => {
              if (currentMessage) {
                handleSend(currentMessage, 2, null);
              }
            }}
            showScrollDownButton={showScrollDownButton}
          />
        </>
      )}
    </div>
  );
});
Chat.displayName = 'Chat';

{
  /* <div>
<div className="flix flex-col">
  <Instanse slot={3884568135} client={5328097012407543} />
  <Instanse slot={3884568135} client={5328097012407543} />
</div>
<div className="flix flex-col">
  <Instanse slot={3884568135} client={5328097012407543} />
  <Instanse slot={3884568135} client={5328097012407543} />
</div>
</div> */
}
