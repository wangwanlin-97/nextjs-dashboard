'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

function debounce(fn: Function, delay: number = 150) {
  let timer: any;
  return function (...args: any) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply({}, args);
    }, delay);
  };
}

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  // get replace method to update the search url
  const { replace } = useRouter();
  // get current url path
  const path = usePathname();
  const handleSearch = debounce((value: string) => {
    console.log(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('query', value);
      params.set("page","1")
    } else {
      params.delete('query');
    }
    // update the search
    replace(path + '?' + params.toString());
  }, 500);
  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        defaultValue={searchParams.get('query')?.toString()}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
