import { IconCheck, IconClipboard, IconDownload } from '@tabler/icons-react';
import { FC, memo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { useTranslation } from 'next-i18next';

import {
  generateRandomString,
  programmingLanguages,
} from '@/utils/app/codeblock';

interface Props {
  language: string;
  value: string;
}

export const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { t } = useTranslation('markdown');
  const [isCopied, setIsCopied] = useState<Boolean>(false);

  const copyToClipboard = () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return;
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  };
  const downloadAsFile = () => {
    const fileExtension = programmingLanguages[language] || `.${language}`;
    const suggestedFileName = `openkh-code-${generateRandomString(10,true)}${fileExtension}`;
    const fileName = window.prompt(
      t('Enter file name') || '',
      suggestedFileName,
    );

    if (!fileName) {
      // user pressed cancel on prompt
      return;
    }

    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return (
    <div className="codeblock group/code relative font-sans text-[1rem]">
      <div className="absolute flex items-center justify-between right-0 p-1">
        <div className="flex invisible group-hover/code:visible group-focus/code:visible items-center border border-slate-700 rounded-md">
          <button
            className="flex gap-1.5 items-center rounded bg-none p-1 text-xs text-white"
            onClick={copyToClipboard}
          >
            {isCopied ? <IconCheck size={18} /> : <IconClipboard size={18} />}
            {isCopied ? t('Copied!') : language}
          </button>
          |
          <button
            className="flex items-center rounded bg-none p-1 text-xs text-white"
            onClick={downloadAsFile}
          >
            <IconDownload size={18} />
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, backgroundColor: 'black' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';
