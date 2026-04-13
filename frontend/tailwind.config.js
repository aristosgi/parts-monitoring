/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        urgency: {
          1: '#10b981', // green
          2: '#3b82f6', // blue
          3: '#eab308', // yellow
          4: '#f97316', // orange
          5: '#ef4444', // red
        },
        status: {
          pending: '#94a3b8',
          waiting: '#f59e0b',
          ordered: '#3b82f6',
          transit: '#8b5cf6',
          delivered: '#10b981',
          cancelled: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
