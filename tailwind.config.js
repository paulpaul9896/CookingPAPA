/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'bg-red-50', 'bg-red-100', 'text-red-600', 'border-red-100', 'hover:bg-red-100',
    'bg-green-50', 'bg-green-100', 'text-green-600', 'border-green-100', 'hover:bg-green-100',
    'bg-gray-50', 'text-gray-500', 'border-transparent',
    'ring-2', 'ring-blue-500', 'ring-purple-500', 'shadow-md',
    'bg-purple-50', 'text-purple-700',
    'fill-red-500', 'fill-yellow-500',
    'border-blue-500', 'bg-blue-500', 'text-white',
    'animate-pulse',
    'line-through',
  ],
}
