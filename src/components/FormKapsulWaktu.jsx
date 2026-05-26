import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabaseClient'; 

export default function FormKapsulWaktu({ userLocal }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [pesan, setPesan] = useState('');
  
  const [savedData, setSavedData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // READ: Ambil data dari kolom yang sudah bersih
  const fetchSavedData = async () => {
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
    }
  };

  useEffect(() => {
    if (userLocal?.nim) {
      fetchSavedData();
    }
  }, [userLocal]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // CREATE / UPDATE: Menggunakan nama kolom baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !pesan.trim()) {
      alert("Pilih foto and isi pesannya dulu dong bos!");
      return;
    }

    setIsUploading(true);
    setUploadStatus('Memeras ukuran foto... 🗜️');

    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1080, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      setUploadStatus('Mengirim ke Kapsul Waktu... 🚀');
      const fileName = `${userLocal.nim}_now.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('foto_anniversary')
        .upload(fileName, compressedFile, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('foto_anniversary')
        .getPublicUrl(fileName);

      setUploadStatus('Menyimpan ke database... 💾');

      const { error: dbError } = await supabase
        .from('alumni')
        .update({
          foto_now: urlData.publicUrl,
          pesan_anniv: pesan
        })
        .eq('nim', userLocal.nim);

      if (dbError) throw dbError;

      setUploadStatus('Berhasil! Kapsul Waktu terkunci. 🔒');
      alert('Mantap! Data Kapsul Waktu kamu berhasil disimpan.');
      
      setFile(null);
      setPreviewUrl('');
      setPesan('');
      fetchSavedData();

    } catch (error) {
      console.error("Gagal upload:", error);
      setUploadStatus('Gagal upload! Coba lagi.');
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  // DELETE: Mengosongkan kolom baru
  const handleDelete = async () => {
    const isConfirm = window.confirm('Yakin mau menghapus data Kapsul Waktu kamu? Foto dan pesan lama bakal hilang permanen.');
    if (!isConfirm) return;

    setIsUploading(true);
    setUploadStatus('Menghapus data lama... 🗑️');

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

      alert('Data kapsul berhasil dihapus! Silakan isi data baru.');
      fetchSavedData(); 

    } catch (error) {
      console.error("Gagal menghapus:", error);
      alert(`Gagal menghapus: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const isSaved = savedData !== null;

  return (
    <div className="flex flex-col items-center w-full text-white font-sans">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-yellow-500 tracking-wider">KAPSUL WAKTU TL16</h2>
          <p className="text-slate-400 mt-2 text-sm">Setor 1 foto terkece & 1 pesan maut terbaikmu sekarang!</p>
        </div>

        <div className={`p-5 rounded-2xl border-2 transition-all ${isSaved ? 'bg-green-900/10 border-green-500/50' : 'bg-slate-800 border-slate-700'}`}>
          
          <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2">
            <h3 className={`font-bold ${isSaved ? 'text-green-400' : 'text-yellow-400'}`}>
              📦 KAPSUL WAKTU KAMU {isSaved && "— TERKUNCI 🔒"}
            </h3>
            
            {isSaved && (
              <button 
                type="button"
                onClick={handleDelete}
                disabled={isUploading}
                className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                Hapus & Ganti
              </button>
            )}
          </div>

          {isSaved ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-600 bg-slate-950">
                <img src={savedData.foto} alt="Saved Kapsul" className="w-full h-full object-cover" />
              </div>
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-700 h-48 overflow-y-auto flex flex-col justify-center">
                <p className="text-xs text-slate-500 mb-1 font-bold font-mono">ISI PESAN UNTUK ANGKATAN:</p>
                <p className="text-sm text-slate-200 italic leading-relaxed">"{savedData.pesan}"</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-300">Upload Foto (2026)</label>
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-500 border-dashed rounded-xl cursor-pointer hover:border-yellow-500 transition-all overflow-hidden relative bg-slate-900">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-90" />
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-3xl">📸</span>
                        <p className="text-xs text-slate-400 mt-2">Tap untuk pilih foto</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      disabled={isUploading} 
                    />
                  </label>
                </div>

                <div className="flex flex-col">
                  <label className="block text-xs font-bold mb-1 text-slate-300">
                    Apa pesan yang ingin kalian sampaikan untuk anak-anak Tekling 16 yang lain?
                  </label>
                  <p className="text-[10px] text-yellow-400 mb-2 italic font-mono"></p>
                  <textarea
                    rows="4"
                    maxLength={200}
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    placeholder="Tulis pesan haru, doa, atau jokes tongkrongan kuliah..."
                    className="flex-1 w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:border-yellow-500 resize-none"
                    disabled={isUploading}
                  />
                  <div className="text-right mt-1">
                    <span className={`text-[10px] font-mono ${pesan.length >= 200 ? 'text-red-500' : 'text-slate-500'}`}>
                      {pesan.length}/200
                    </span>
                  </div>
                </div>

              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-lg py-4 rounded-xl shadow-[0_10px_20px_rgba(234,179,8,0.2)] transition-all active:scale-95 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  {isUploading ? (uploadStatus || "Memproses...") : "KIRIM KE KAPSUL WAKTU ✉️"}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}