import {
  IconArrowAutofitRight,
  IconArrowRight,
  IconClearAll,
  IconDeviceMobile,
  IconDeviceMobileX,
  IconError404Off,
  IconSettings,
} from '@tabler/icons-react';
import { IconSquareRoundedArrowRight } from '@tabler/icons-react';
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
import { getSettings } from '@/utils/app/settings';
import { throttle } from '@/utils/data/throttle';
import { LANGS } from '@/utils/server';

import { ChatBody, Conversation, Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

import Instanse from '../Instanse';
import Select from '../Select';
import Spinner from '../Spinner';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import { ModelSelect } from './ModelSelect';
import { SystemPrompt } from './SystemPrompt';
import { TemperatureSlider } from './Temperature';

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
        let body;
        if (!plugin) {
          body = JSON.stringify(chatBody);
        } else {
          body = JSON.stringify({
            ...chatBody,
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
      title: '"Code a snake game"',
      body: 'Code a basic snake game in python, give explanations for each step.',
    },
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
    {
      title: '"Assist in a task"',
      body: 'How do I make a delicious lemon cheesecake?',
    },
    {
      title: '"Explain quantum computing in simple terms"',
      body: 'Explain quantum computing in simple terms',
    },
  ];
  // return (
  //     <div className='bg-gray-800 flex flex-col text-3xl items-center justify-center h-full w-full'>
  //       <p className='uppercase text-7xl'>😭</p>
  //       <IconError404Off size={404}/>
  //       <div className='flex flex-row shadow-sm bg-slate-500 text-white px-3 py-1 rounded-2xl mb-2'>
  //         <IconArrowRight className='mt-1.5 mr-3'/>
  //         <a href="http://chat.openkh.org" className='uppercase dark:text-gray-300' target="_blank" rel="noopener noreferrer">
  //           Testing
  //         </a>
  //       </div>
  //       <p className='uppercase'>Maintenance mod</p>
  //       <div className="group cursor-pointer overflow-hidden rounded-xl border dark:border-gray-800">
  //         <div className="flex p-3">
  //           <div className="text-base text-gray-600 w-auto">
  //             <p className="uppercase dark:text-gray-300">
  //               Upcomming GPT-4 and CHAT-IMAGE
  //             </p>
  //             <div className="w-0 h-0 ml-16 transition-all ease-in-out invisible group-hover:w-[170px] group-hover:h-auto group-hover:visible focus:visible focus:w-full hover:-translate-y-1 hover:scale-110 duration-900">
  //               <Image
  //                 alt=""
  //                 width={150}
  //                 height={150}
  //                 src="/ABA.png"
  //                 className="p-1"
  //               />
  //             </div>
  //             <div className="flex items-center gap-5 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
  //               <a
  //                 href="https:link.payway.com.kh/aba?id=F4FCBA4B6EE6&code=783364&acc=015949757"
  //                 target="_blank"
  //                 rel="noreferrer"
  //                 className="flex items-center hover:underline"
  //               >
  //                 <IconSquareRoundedArrowRight className="mr-1.5 text-xs text-gray-400" />
  //                 Support me by (ABA: 015949757)
  //                 <div className="max-sm:hidden">&nbsp;</div>
  //               </a>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  // );
  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {!(apiKey || serverSideApiKeyIsSet) ? (
        <div className="mx-auto flex h-full w-[300px] flex-col justify-center space-y-6 sm:w-[600px]">
          <div className="text-center text-4xl font-bold text-black dark:text-white">
            Welcome to {appName}
          </div>
          <div className="text-center text-lg text-black dark:text-white">
            <div className="mb-8">
              {appName + ` is an open source clone of OpenAI's ChatGPT UI.`}
            </div>
            <div className="mb-2 font-bold">
              Important: {appName} is 100% unaffiliated with OpenAI.
            </div>
          </div>
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="mb-2">
              {appName} allows you to plug in your API key to use this UI with
              their API.
            </div>
            <div className="mb-2">
              It is <span className="italic">only</span> used to communicate
              with their API.
            </div>
            <div className="mb-2">
              {t(
                'Please set your OpenAI API key in the bottom left of the sidebar.',
              )}
            </div>
            <div>
              {t("If you don't have an OpenAI API key, you can get one here: ")}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                openai.com
              </a>
            </div>
          </div>
        </div>
      ) : modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {/* <div className="flix flex-col">
              <Instanse slot={3884568135} client={5328097012407543} />
              <Instanse slot={3884568135} client={5328097012407543} />
            </div> */}
            {selectedConversation?.messages.length === 0 ? (
              <div className="max-sm:max-h-[730px]">
                <div className="mx-auto flex flex-col space-y-5 md:space-y-5 px-3 pt-5 md:pt-12 sm:max-w-[900px]">
                  <p className="max-sm:hidden md:block text-bold font-medium text-3xl uppercase text-center py-10">
                    AI Chat
                  </p>
                  <div className="my-auto grid gap-8 lg:grid-cols-3">
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
                        </p>
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      {/* {models.length > 0 && (
                      <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
                        <ModelSelect />
                        <TemperatureSlider
                          key={'ertyjnhv'}
                          label={t('Temperature')}
                          onChangeTemperature={(temperature) =>
                            handleUpdateConversation(selectedConversation, {
                              key: 'temperature',
                              value: temperature,
                            })
                          }
                        />
                      </div>
                    )} */}

                        <div className="flex items-center rounded-xl bg-gray-100 p-1 text-sm dark:bg-gray-800 mb-4">
                          <span className="mr-2 inline-flex items-center rounded-lg bg-gradient-to-br from-yellow-300 px-2 py-1 text-xxs font-medium uppercase leading-3 text-yellow-700 dark:from-[#373010] dark:text-yellow-400">
                            New
                          </span>
                          Upcomming GPT-4 and CHAT-IMAGE
                          <div className="ml-auto shrink-0">
                          </div>
                        </div>
                      <div className="group cursor-pointer overflow-hidden rounded-xl border dark:border-gray-800">
                        <div className="flex p-3">
                          <div className="w-0 h-0 transition-all ease-in-out invisible group-hover:w-[170px] group-hover:h-auto group-hover:visible focus:visible focus:w-full hover:-translate-y-1 hover:scale-110 duration-900">
                            <Image
                              alt=""
                              width={150}
                              height={150}
                              src="/ABA.png"
                              className="p-1"
                            />
                          </div>
                          <div className="text-base text-gray-600 w-auto">
                            <p className=" dark:text-red-500">MAINTENANCE MOD</p>
                            <p className="dark:text-gray-400">
                              5x faster, Mr.Phearum is in charge of all
                              information.
                              <span className="flex mt-2">
                                <IconDeviceMobile className="mr-1.5 text-xs text-gray-400" />
                                UI supported on mobile
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-5 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          <a
                            href="https://link.payway.com.kh/aba?id=F4FCBA4B6EE6&code=783364&acc=015949757"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center hover:underline"
                          >
                            <svg
                                viewBox="0 0 32 32"
                                width="1.2em"
                                height="1.2em"
                                className="mr-1.5 text-xs"
                              >
                                <path
                                  fill="currentColor"
                                  d="M10 6v2h12.59L6 24.59L7.41 26L24 9.41V22h2V6H10z"
                                ></path>
                              </svg>
                            {/* <IconSquareRoundedArrowRight className="mr-1.5 text-xs text-gray-400" /> */}
                            Support me by (ABA: 015949757)
                            <div className="max-sm:hidden">&nbsp;</div>
                          </a>
                        </div>
                      </div>
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
                <div className="max-sm:hidden sm:sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  {selectedConversation?.name}
                </div>
                <div className="px-2 max-sm:pr-4">
                  <div className="sm:ml-0 md:mr-5 lg:ml-10 xl:ml-20">
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
                </div>
              </>
            )}
            {/* <div className="flix flex-col">
              <Instanse slot={3884568135} client={5328097012407543} />
              <Instanse slot={3884568135} client={5328097012407543} />
            </div> */}
          </div>

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
