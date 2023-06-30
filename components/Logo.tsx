import Image from "next/image";

interface Props {
  className?: string;
  width?: number;
  height?: number;
}
export default function Logo(props: Props) {
  return (
    <div {...props}>
      <Image
        alt=""
        width={props.width??10}
        height={props.height??10}
        src="/loading.png"
        className="h-full w-full flex-none select-none"
      />
    </div>
  )
}