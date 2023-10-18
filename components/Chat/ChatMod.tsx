import { IconDeviceMobile } from '@tabler/icons-react';
import { ReactNode, memo } from 'react';

import Image from 'next/image';

interface Props {
  children?: ReactNode;
}

export const ChatMode = memo(({ children }: Props) => {
  return (
    <>
      {/* <div className="flex items-center rounded-xl bg-gray-100 text-gray-700 p-1 text-sm dark:bg-gray-800 mb-4">
        <span className="mr-2 inline-flex items-center rounded-lg bg-gradient-to-br from-yellow-300 px-2 py-1 text-xxs font-medium uppercase leading-3 text-yellow-700 dark:from-[#373010] dark:text-yellow-400">
          New
        </span>
        <span className=' dark:text-white'>GPT-4 is using and CHAT-IMAGE is implemeneting</span>
        <div className="ml-auto shrink-0"></div>
      </div> */}
      <div className="group max-sm:h-[auto] overflow-hidden rounded-xl border dark:border-gray-800">
        <div className="flex max-sm:group-hover:h-[350px] max-sm:relative p-3">
          <div className="w-0 h-0 transition-all ease-in-out invisible group-hover:w-[170px] max-sm:group-hover:w-full group-hover:visible group-focus:visible group-focus:w-full hover:-translate-y-1 hover:scale-110 duration-900">
            <Image
              alt=""
              width={350}
              height={350}
              src="/ABA.png"
              className="hidden max-sm:px-7 max-sm:absolute cursor-pointer group-focus:block group-hover:block"
            />
          </div>
          <div className="pl-2 text-base text-gray-600 w-auto max-sm:w-full max-sm:group-focus:invisible max-sm:group-hover:invisible">
            <p className=" dark:text-red-400 flex">
              Welcome
              {/* <span className="pl-2 flex text-brack dark:text-white">
                <svg
                  viewBox="0 0 32 32"
                  width="1.2em"
                  height="1.2em"
                  className="mr-1.5 mt-1 text-xs"
                >
                  <path
                    fill="currentColor"
                    d="M10 6v2h12.59L6 24.59L7.41 26L24 9.41V22h2V6H10z"
                  ></path>
                </svg>
                <a
                  href="http://chat.openkh.org"
                  className=" shadow-xl rounded-md px-2 border border-red-600 cursor-pointer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TEST HERE
                </a>
              </span> */}
            </p>
            <p className="dark:text-gray-400">
              Hello! My name is Open Brain, and I`m here to assist you with any questions or tasks you may have. I`m managed by Mr. Phearum, who has entrusted me with the responsibility of helping users like you. How can I help you today?
              <span className="flex mt-2">
                <IconDeviceMobile className="mr-1.5 text-xs text-gray-400" />
                UI supported on mobile
              </span>
              {/* {ChatMode
                [
                  {name: "HR Management", link: "https://hr.openkh.org", by: "Lim Lenger"},
                  {name: "Revamp & enhance Deam Computer Int'l website", link: "https://deam.openkh.org", by: "Chhoem Nikkare"}
                ].map(web=>{
                    return <div className='m-1 flex shadow-md rounded-md '>
                      <div className='flex-row w-full items-center p-4'>
                        <a href={web.link} target="_blank" rel="noreferrer" className='pt-2'>
                          <iframe src={web.link} frameBorder="0"/>
                        {web.name} by: <span className='text-md'>Mr. {web.by}</span></a>
                      </div>
                    </div>
                  })
              } */}
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
            Coffee/Donate by (ABA: 015949757)
            <div className="max-sm:hidden">&nbsp;</div>
          </a>
        </div>
      </div>
      {children}
    </>
  );
});
ChatMode.displayName = 'ChatMode';