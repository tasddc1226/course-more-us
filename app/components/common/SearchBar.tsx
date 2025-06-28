import { Form, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { cn } from "~/utils/cn";

interface SearchBarProps {
  initialQuery?: string;
  className?: string;
}

export default function SearchBar({ initialQuery = "", className }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form
      method="get"
      action="/search"
      className={cn("flex items-center w-full max-w-md", className)}
    >
      <input
        type="text"
        name="q"
        required
        placeholder="장소나 지역을 검색하세요"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      />
      <button
        type="submit"
        disabled={isSubmitting || query.trim().length === 0}
        className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 disabled:opacity-50"
      >
        검색
      </button>
    </Form>
  );
}