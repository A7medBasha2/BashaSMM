import React from 'react';
import { X, Camera, ExternalLink, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProofModal: React.FC = () => {
  const { isProofModalOpen, selectedProofUrl, closeProofModal } = useApp();

  if (!isProofModalOpen || !selectedProofUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#13131A] border border-amber-500/40 p-5 space-y-4 gold-glow relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#23232F] pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            لقطة شاشة لإثبات تنفيذ العملية (Execution Proof)
          </h3>
          <button
            onClick={closeProofModal}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            تم التقاط هذه الصورة الحية من داخل متصفح الهاتف فور الضغط الفعلي على زر التفاعل في فيسبوك:
          </p>
          <div className="rounded-xl overflow-hidden border border-[#2A2A38] bg-black flex items-center justify-center max-h-[500px]">
            <img
              src={selectedProofUrl}
              alt="Proof Screenshot"
              className="max-h-[480px] w-auto object-contain rounded-lg"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <a
              href={selectedProofUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-400 hover:underline flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح الصورة بحجمها الكامل في نافذة جديدة</span>
            </a>
            <div className="flex items-center gap-2">
              <a
                href={selectedProofUrl}
                download="facebook_action_proof.jpg"
                className="px-3 py-1.5 rounded-lg bg-[#20202E] hover:bg-[#28283A] text-slate-200 text-xs flex items-center gap-1 border border-[#2F2F3E]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل</span>
              </a>
              <button
                onClick={closeProofModal}
                className="px-4 py-1.5 rounded-lg bg-[#181822] hover:bg-[#20202E] text-slate-300 text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
