import React, { useState, useEffect, useRef } from 'react';
import PlayerAvatar from './PlayerAvatar';
import RedactedText from './RedactedText';
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
      <span className="block text-xs font-bold text-zinc-700">
        {label}
      </span>
      <div className="flex flex-wrap gap-2.5 sm:gap-2">
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
              className={`w-11 h-11 md:w-9 md:h-9 rounded-lg border-2 border-[#FFFDF9] transition-transform ${
                isSelected ? 'ring-2 ring-[#14532D] scale-105' : 'ring-1 ring-[#CEC6B6] hover:scale-105'
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
      <span className="block text-xs font-bold text-zinc-700">
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
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                isSelected
                  ? 'bg-[#14532D] text-white border-[#14532D]'
                  : 'bg-[#F8F6F1] text-zinc-800 border-[#DED8CA] hover:bg-[#EFE9DC]'
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
export default function AvatarDesigner({
  user,
  initialConfig,
  onSave,
  onCancel,
  isEditing = false,
  isMonopoliUnlocked = false
}) {
  const [config, setConfig] = useState(() =>
    initialConfig ? normalizeAvatarConfig(initialConfig) : generateSeedAvatarConfig(user?.nim || 'tl16')
  );
  const [saving, setSaving] = useState(false);
  const hasEditedRef = useRef(false);

  useEffect(() => {
    if (initialConfig && !hasEditedRef.current) {
      setConfig(normalizeAvatarConfig(initialConfig));
    }
  }, [initialConfig]);

  const updateField = (key, val) => {
    hasEditedRef.current = true;
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const handleRandomize = () => {
    hasEditedRef.current = true;
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
    <div className="min-h-[100dvh] bg-[#F8F6F1] text-zinc-900 p-4 sm:p-6 md:p-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DED8CA] pb-5">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <img
              src="/Asset 2.webp"
              alt="Reuni 1 Dekade TL 2016"
              width="112"
              height="44"
              fetchPriority="high"
              className="w-20 sm:w-28 h-auto shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-zinc-900 leading-tight truncate">
                Desain Karakter {user?.nama || 'Alumni TL 2016'}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 mt-0.5">
                NIM <span className="font-mono font-semibold text-[#14532D]">{user?.nim}</span>
              </p>
            </div>
          </div>

          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FFFDF9] hover:bg-[#EFE9DC] border border-[#DED8CA] text-zinc-800 font-bold text-xs sm:text-sm transition-colors"
            >
              Batal &amp; Kembali
            </button>
          )}
        </header>

        <section className="bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-7 lg:gap-9 items-start">
            {/* Left Preview Stage */}
            <div className="md:col-span-5 flex flex-col gap-4 md:sticky md:top-6">
              <div className="rounded-2xl bg-[#14532D] p-5 sm:p-6 lg:p-8 text-center flex flex-col items-center gap-4 border border-[#0F3F22]">
                <div className="w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52 rounded-full border-4 border-[#FFFDF9] overflow-hidden flex items-center justify-center bg-[#F1ECE0]">
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
                  <p className="text-xs text-emerald-100 mt-1">
                    Tampil di profil Beranda, Klasemen, dan{' '}
                    <RedactedText revealed={isMonopoliUnlocked} onDark={true} widthClass="w-24">
                      bidak Monopoli
                    </RedactedText>
                    .
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="min-h-[48px] px-4 py-3 rounded-xl bg-[#F1ECE0] hover:bg-[#E7DFCE] border border-[#DED8CA] text-zinc-900 font-bold text-sm transition-colors"
                >
                  Acak Karakter
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={saving}
                  className={`min-h-[48px] px-4 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                    saving
                      ? 'bg-[#E5DFD2] text-zinc-800'
                      : 'bg-[#14532D] hover:bg-[#166534] text-white'
                  }`}
                >
                  {saving ? 'Menyimpan...' : 'Simpan & Masuk Beranda'}
                </button>
              </div>
            </div>

            {/* Right Controls */}
            <div className="md:col-span-7 space-y-5">
              <div className="border-b border-[#E5DFD2] pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  Pilih Gaya &amp; Detail Karakter
                </h2>
                <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
                  Seluruh pilihanmu otomatis tersimpan ke akun alumni untuk dipakai di Beranda, Klasemen, dan{' '}
                  <RedactedText revealed={isMonopoliUnlocked} widthClass="w-24">
                    bidak Monopoli
                  </RedactedText>
                  .
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
