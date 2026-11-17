import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabaseClient'; 

export default function FormKapsulWaktu({ userLocal }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [pesan, setPesan] = useState('');
  
  const [savedData, setSavedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const fetchSavedData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('foto_now, pesan_anniv')
        .eq('nim', userLocal.nim)
        .single();

      if (error) throw error;

      if (data && (data.foto_now || data.pesan_anniv)) {
        setSavedData({
          foto: data.foto_now,
          pesan: data.pesan_anniv
        });
      } else {
        setSavedData(null);
      }
    } catch (error) {
      console.error("Gagal menarik data lama:", error.message);
      setErrorMsg('Gagal memuat data Kapsul Waktu. Silakan muat ulang atau coba beberapa saat lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userLocal?.nim) {
      fetchSavedData();
    } else {
      setIsLoading(false);
    }
  }, [userLocal]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !pesan.trim()) {
      setErrorMsg("Pilih foto dan isi pesannya terlebih dahulu.");
      return;
    }

    setErrorMsg('');
    setIsUploading(true);
    setUploadStatus('Mengoptimalkan ukuran foto...');

    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1080, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      setUploadStatus('Mengirim ke Kapsul Waktu...');
      const fileName = `${userLocal.nim}_now.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('foto_anniversary')
        .upload(fileName, compressedFile, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('foto_anniversary')
        .getPublicUrl(fileName);

      setUploadStatus('Menyimpan ke buku kenangan...');

      const { error: dbError } = await supabase
        .from('alumni')
        .update({
          foto_now: urlData.publicUrl,
          pesan_anniv: pesan
        })
        .eq('nim', userLocal.nim);

      if (dbError) throw dbError;

      setUploadStatus('Berhasil! Kapsul Waktu tersimpan.');
      setFile(null);
      setPreviewUrl('');
      setPesan('');
      await fetchSavedData();

    } catch (error) {
      console.error("Gagal upload:", error);
      setUploadStatus('');
      setErrorMsg(`Gagal mengunggah kapsul waktu: ${error.message}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  const handleDelete = async () => {
    const isConfirm = window.confirm('Yakin ingin mengganti isi Kapsul Waktu kamu? Foto dan pesan sebelumnya akan dihapus.');
    if (!isConfirm) return;

    setErrorMsg('');
    setIsUploading(true);
    setUploadStatus('Menghapus data lama...');

    try {
      const fileName = `${userLocal.nim}_now.jpg`;
      await supabase.storage.from('foto_anniversary').remove([fileName]);

      const { error } = await supabase
        .from('alumni')
        .update({
          foto_now: null,
          pesan_anniv: null
        })
        .eq('nim', userLocal.nim);

      if (error) throw error;

      await fetchSavedData(); 

    } catch (error) {
      console.error("Gagal menghapus:", error);
      setErrorMsg(`Gagal menghapus data kapsul: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const isSaved = savedData !== null;

  return (
    <div className="flex flex-col items-center w-full text-stone-900 font-sans">
      <div className="w-full bg-white border border-[#DED6C6] rounded-2xl p-6 md:p-8">
        
        <div className="mb-6 pb-4 border-b border-[#DED6C6]">
          <h3 className="text-2xl md:text-3xl font-bold text-stone-900">Kapsul Waktu TL 2016</h3>
          <p className="text-stone-600 mt-1 text-sm">
            Unggah foto terbarumu di tahun 2026 beserta doa atau pesan hangat untuk Sedulur 16.
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={fetchSavedData}
              className="px-3 py-2 min-h-[44px] rounded-lg bg-white hover:bg-rose-100 text-rose-900 text-xs font-bold border border-rose-300 shrink-0"
            >
              Muat Ulang
            </button>
          </div>
        )}

        <div className={`p-5 rounded-xl border transition-colors ${isSaved ? 'bg-[#FAF6EE] border-green-700/40' : 'bg-[#FAF6EE] border-[#DED6C6]'}`}>
          
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4 border-b border-[#DED6C6] pb-3">
            <h4 className={`font-bold text-base ${isSaved ? 'text-green-900' : 'text-stone-900'}`}>
              {isSaved ? "Kapsul Waktu Kamu (Tersimpan)" : "Isi Kapsul Waktu Kamu"}
            </h4>
            
            {isSaved && (
              <button 
                type="button"
                onClick={handleDelete}
                disabled={isUploading}
                className="text-xs bg-rose-700 hover:bg-rose-600 text-white px-4 py-2 min-h-[44px] rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                Hapus &amp; Ganti Isi
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-stone-600 text-sm font-mono">
              Memeriksa Kapsul Waktu kamu...
            </div>
          ) : isSaved ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="h-52 w-full rounded-xl overflow-hidden border border-[#DED6C6] bg-white">
                <img
                  src={savedData.foto}
                  alt={`Foto terbaru ${userLocal?.nama || 'Alumni TL 2016'}`}
                  width="360"
                  height="208"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-white p-5 rounded-xl border border-[#DED6C6] h-52 overflow-y-auto flex flex-col justify-center">
                <p className="text-xs text-green-900 mb-2 font-bold uppercase tracking-wide">Pesan Untuk Angkatan</p>
                <p className="text-sm text-stone-800 leading-relaxed">{savedData.pesan}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div>
                  <label htmlFor="upload-foto-kapsul" className="block text-xs font-bold mb-2 text-stone-800">
                    Unggah Foto Terbaru (2026)
                  </label>
                  <label
                    htmlFor="upload-foto-kapsul"
                    className="flex flex-col items-center justify-center w-full h-44 border-2 border-[#C7BDA8] border-dashed rounded-xl cursor-pointer hover:border-green-800 transition-colors overflow-hidden relative bg-white"
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Pratinjau foto kapsul waktu"
                        width="320"
                        height="176"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-sm font-bold text-green-900">Pilih Foto Terbaru</p>
                        <p className="text-xs text-stone-500 mt-1">Format JPG/PNG/WebP, otomatis dikompresi</p>
                      </div>
                    )}
                    <input 
                      id="upload-foto-kapsul"
                      type="file" 
                      className="sr-only" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      disabled={isUploading} 
                    />
                  </label>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="pesan-kapsul" className="block text-xs font-bold mb-2 text-stone-800">
                    Pesan &amp; Doa untuk Sedulur 16
                  </label>
                  <textarea
                    id="pesan-kapsul"
                    rows="4"
                    maxLength={200}
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    placeholder="Tulis pesan hangat, doa, atau kenangan seru waktu kuliah..."
                    className="flex-1 w-full bg-white border border-[#C7BDA8] rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:border-green-800 resize-none"
                    disabled={isUploading}
                  />
                  <div className="text-right mt-1.5">
                    <span className={`text-xs font-mono ${pesan.length >= 200 ? 'text-rose-700 font-bold' : 'text-stone-600'}`}>
                      {pesan.length}/200 karakter
                    </span>
                  </div>
                </div>

              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full min-h-[48px] bg-green-900 hover:bg-green-800 text-white font-bold text-base py-3.5 px-6 rounded-xl transition-colors disabled:bg-stone-300 disabled:text-stone-600"
                >
                  {isUploading ? (uploadStatus || "Memproses...") : "Simpan ke Kapsul Waktu"}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
