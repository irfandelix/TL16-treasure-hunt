import React, { useState, useEffect } from 'react';
import PlayerAvatar from './PlayerAvatar';
import {
  SKIN_PALETTE,
  CIRCLE_PALETTE,
  HAIR_PALETTE,
  SHIRT_PALETTE,
  TOP_CHOICES,
  SHIRT_CHOICES,
  GLASSES_CHOICES,
  MOUTH_CHOICES,
  EYE_CHOICES,
  normalizeAvatarConfig,
  generateSeedAvatarConfig
} from '../lib/avatarHelper';

function ColorSwatches({ label, palette, selected, onSelect }) {
  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {palette.map((item) => {
          const isSelected = selected?.toLowerCase() === item.hex.toLowerCase();
          return (
            <button
              key={item.hex}
              type="button"
              title={item.label}
              aria-label={`${label}: ${item.label}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(item.hex)}
              className={`w-7 h-7 rounded-lg border-2 border-white transition-transform ${
                isSelected ? 'ring-2 ring-emerald-700 scale-110' : 'ring-1 ring-slate-300 hover:scale-105'
              }`}
              style={{ backgroundColor: item.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}

function OptionPills({ label, options, selected, onSelect }) {
  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(opt.id)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Interactive character studio using Open Peeps vector illustrations with custom Hijab support.
 */
export default function AvatarDesigner({ user, initialConfig, onSave, onCancel, isEditing = false }) {
  const [config, setConfig] = useState(() =>
    initialConfig ? normalizeAvatarConfig(initialConfig) : generateSeedAvatarConfig(user?.nim || 'tl16')
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(normalizeAvatarConfig(initialConfig));
    }
  }, [initialConfig]);

  const updateField = (key, val) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const handleRandomize = () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    setConfig({
      skinColor: pick(SKIN_PALETTE).hex,
      circleBg: pick(CIRCLE_PALETTE).hex,
      top: pick(TOP_CHOICES).id,
      topColor: pick(HAIR_PALETTE).hex,
      shirt: pick(SHIRT_CHOICES).id,
      shirtColor: pick(SHIRT_PALETTE).hex,
      glasses: pick(GLASSES_CHOICES).id,
      mouth: pick(MOUTH_CHOICES).id,
      eye: pick(EYE_CHOICES).id,
      eyebrow: 'Up'
    });
  };

  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-5">
        {/* Header Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/Asset 2.webp"
              alt="Reuni 1 Dekade TL 2016"
              width="96"
              height="38"
              className="w-20 sm:w-24 h-auto shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Desain Karakter Alumni
              </p>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {user?.nama || 'Peserta TL 2016'}
              </h1>
            </div>
          </div>

          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-colors"
            >
              Batal &amp; Kembali
            </button>
          )}
        </div>

        {/* Bento Main Studio */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-[0_6px_28px_-6px_rgba(15,23,42,0.07)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Stage */}
            <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-6">
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 sm:p-7 text-center text-white flex flex-col items-center gap-4">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-emerald-300">
                  Karakter Kamu di Portal &amp; Monopoli
                </span>

                <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-white/90 shadow-2xl overflow-hidden flex items-center justify-center bg-slate-800">
                  <PlayerAvatar
                    config={config}
                    seed={user?.nim}
                    className="w-full h-full"
                    alt={`Pratinjau karakter ${user?.nama || ''}`}
                  />
                </div>

                <div>
                  <div className="font-bold text-base sm:text-lg text-white">
                    {user?.nama}
                  </div>
                  <div className="text-xs font-mono text-slate-300 mt-0.5">
                    NIM {user?.nim}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="min-h-[48px] px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-sm transition-colors"
                >
                  Acak Karakter
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={saving}
                  className="min-h-[48px] px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? 'Menyimpan...' : 'Simpan & Masuk Beranda'}
                </button>
              </div>
            </div>

            {/* Right Controls */}
            <div className="lg:col-span-7 space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Sesuaikan Penampilanmu
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Detail karakter yang kamu pilih akan tersimpan otomatis dan muncul di kartu profil Beranda serta menjadi bidak di Monopoli.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ColorSwatches
                  label="Warna Kulit"
                  palette={SKIN_PALETTE}
                  selected={config.skinColor}
                  onSelect={(val) => updateField('skinColor', val)}
                />
                <ColorSwatches
                  label="Warna Latar Lingkaran"
                  palette={CIRCLE_PALETTE}
                  selected={config.circleBg}
                  onSelect={(val) => updateField('circleBg', val)}
                />
              </div>

              <OptionPills
                label="Gaya Rambut / Hijab"
                options={TOP_CHOICES}
                selected={config.top}
                onSelect={(val) => updateField('top', val)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ColorSwatches
                  label="Warna Rambut / Hijab"
                  palette={HAIR_PALETTE}
                  selected={config.topColor}
                  onSelect={(val) => updateField('topColor', val)}
                />
                <ColorSwatches
                  label="Warna Baju"
                  palette={SHIRT_PALETTE}
                  selected={config.shirtColor}
                  onSelect={(val) => updateField('shirtColor', val)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <OptionPills
                  label="Model Baju"
                  options={SHIRT_CHOICES}
                  selected={config.shirt}
                  onSelect={(val) => updateField('shirt', val)}
                />
                <OptionPills
                  label="Kacamata"
                  options={GLASSES_CHOICES}
                  selected={config.glasses}
                  onSelect={(val) => updateField('glasses', val)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <OptionPills
                  label="Ekspresi Mulut"
                  options={MOUTH_CHOICES}
                  selected={config.mouth}
                  onSelect={(val) => updateField('mouth', val)}
                />
                <OptionPills
                  label="Bentuk Mata"
                  options={EYE_CHOICES}
                  selected={config.eye}
                  onSelect={(val) => updateField('eye', val)}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
