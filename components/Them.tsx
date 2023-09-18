import Image from "next/image";
export default function Them() {
  return (
    <>
      <div className="relative flex w-full p-1 bg-n-6 rounded-xl before:absolute before:left-1 before:top-1 before:bottom-1 before:w-[calc(50%-0.25rem)] before:bg-n-7 before:rounded-[0.625rem] before:transition-all false">
        <button className="relative z-1 group flex justify-center items-center h-10 basis-1/2 base2 font-semibold transition-colors hover:text-n-1 text-n-1">
          <Image src="/public/icons/light.svg" alt={"Light Mode"} />
          Light
        </button>
        <button className="relative z-1 group flex justify-center items-center h-10 basis-1/2 base2 font-semibold text-n-4 transition-colors hover:text-n-1 false">
          <Image src="/public/icons/dark.svg" alt={"Dark Mode"} />
          Dark
        </button>
      </div>
    </>
  );
}
