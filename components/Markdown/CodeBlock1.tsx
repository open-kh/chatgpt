
import { FC, memo, useState } from 'react';

import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)

interface Props {
  language: string;
  value: string;
}
export const CodeBlock1: FC<Props> = memo(({ language, value }) => {
  const myHtml = hljs.highlight(value, { language: `${language}` }).value
  return (
    <div className='codeblock bg-slate-800 rounded-md p-1.5 pb-0 group/code relative font-sans text-[14px]'>
      <pre className='text-base'>
        <code dangerouslySetInnerHTML={{ __html: myHtml }} />
      </pre>
    </div>
  )
})

CodeBlock1.displayName = 'CodeBlock1';