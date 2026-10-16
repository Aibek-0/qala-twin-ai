"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="fatal">
      <h1>QALA TWIN AI</h1>
      <p>Қате орын алды / Произошла ошибка</p>
      <button onClick={reset}>Қайталау / Повторить</button>
    </div>
  );
}
