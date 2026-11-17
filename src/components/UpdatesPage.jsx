import React, { useState } from 'react';
import { UPDATES_LOG } from '../data/updatesLog';

const CATEGORIES = ['Semua', 'Fitur Baru', 'Perbaikan Bug', 'Desain & UI', 'Keamanan & Akses'];

const CATEGORY_STYLE = {
  'Fitur Baru': 'bg-green-100 text-green-900 border-green-300',
  'Perbaikan Bug': 'bg-rose-50 text-rose-800 border-rose-300',
  'Desain & UI': 'bg-amber-100 text-amber-900 border-amber-300',
  'Keamanan & Akses': 'bg-stone-200 text-stone-800 border-stone-300',
};

export default function UpdatesPage({ onBack }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedDocs, setExpandedDocs] = useState(() => ({ [UPDATES_LOG[0]?.id]: true }));

  const filteredUpdates =
    selectedCategory === 'Semua'
      ? UPDATES_LOG
      : UPDATES_LOG.filter((item) => item.category === selectedCategory);

  const toggleDoc = (id) => {
    setExpandedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-stone-900 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <nav aria-label="Navigasi halaman update" className="mb-6 pb-4 border-b border-[#DED6C6] flex flex-wrap items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#DED6C6] text-green-900 hover:bg-[#F3EDE0] font-bold text-sm transition-colors"
            >
              &larr; Kembali ke Beranda Perayaan
            </button>
          ) : (
            <a
              href="/"
              className="inline-flex items-center min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#DED6C6] text-green-900 hover:bg-[#F3EDE0] font-bold text-sm transition-colors"
            >
              &larr; Kembali ke Beranda Perayaan
            </a>
          )}
          <span className="font-mono text-xs font-bold text-stone-600 bg-[#F3EDE0] px-3 py-1.5 rounded-lg border border-[#DED6C6]">
            Total Pembaruan: {UPDATES_LOG.length}
          </span>
        </nav>

        <header className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <img
              src="/Asset 2.webp"
              alt="Happy Anniversary TL 2016"
              width="120"
              height="47"
              className="w-28 h-auto hidden sm:block"
            />
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-stone-900">
                Catatan Update &amp; Dokumentasi
              </h1>
              <p className="text-stone-600 text-sm md:text-base mt-1">
                Riwayat setiap pembaruan fitur, perbaikan bug, dan dokumentasi teknis Portal 1 Dekade TL 2016.
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter kategori pembaruan">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${
                  isActive
                    ? 'bg-green-900 text-white border-green-900'
                    : 'bg-white text-stone-700 border-[#DED6C6] hover:bg-[#F3EDE0]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <main className="space-y-6 pb-16">
          {filteredUpdates.map((item) => {
            const isExpanded = Boolean(expandedDocs[item.id]);
            const badgeClass = CATEGORY_STYLE[item.category] || 'bg-stone-100 text-stone-800 border-stone-300';

            return (
              <article
                key={item.id}
                className="bg-white border border-[#DED6C6] rounded-2xl p-6 md:p-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#FAF6EE] border border-[#DED6C6] text-stone-900 px-2.5 py-1 rounded-md">
                      {item.version}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${badgeClass}`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-stone-500">
                    {item.date} {item.commit && item.commit !== 'latest' ? `• ${item.commit}` : ''}
                  </div>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-stone-900 mb-2">
                  {item.title}
                </h2>
                <p className="text-stone-700 text-sm md:text-base leading-relaxed mb-4">
                  {item.summary}
                </p>

                <ul className="list-disc list-inside space-y-1.5 text-sm text-stone-700 mb-5">
                  {item.changes.map((chg, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {chg}
                    </li>
                  ))}
                </ul>

                <div className="border-t border-[#EDE6D8] pt-4">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => toggleDoc(item.id)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF6EE] hover:bg-[#F3EDE0] border border-[#DED6C6] text-xs font-bold text-stone-800 transition-colors"
                  >
                    {isExpanded ? 'Sembunyikan Dokumentasi Teknis' : 'Lihat Dokumentasi Teknis'}
                  </button>

                  {isExpanded && item.docs && (
                    <div className="mt-4 bg-[#FAF6EE] border border-[#DED6C6] rounded-xl p-4 space-y-3 text-xs">
                      <div>
                        <p className="font-bold text-stone-900 mb-1">Catatan Implementasi:</p>
                        <p className="text-stone-700 leading-relaxed">{item.docs.notes}</p>
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 mb-1.5">File Terkait:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.docs.files.map((filePath) => (
                            <code
                              key={filePath}
                              className="font-mono bg-white border border-[#DED6C6] text-green-900 px-2 py-0.5 rounded-md"
                            >
                              {filePath}
                            </code>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </main>
      </div>
    </div>
  );
}
