import React from 'react';

export default function Empty({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-gray-500">
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p>Coming soon...</p>
    </div>
  );
}
