export default function Btn({children, onClick, disabled, className}){
  return (
    <button
      className={`mx-auto flex w-fit items-center rounded-3xl border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white `+className}
      onClick={onClick}
      disabled={disabled}
      >
      {children}
    </button>
  )
}