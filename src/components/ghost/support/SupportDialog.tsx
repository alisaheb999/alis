import { useState, useEffect } from "react";
import { X, Send, Cpu, Layers, HardDrive, Terminal } from "lucide-react";
import { useLang } from "../../../lib/i18n";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SupportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SupportDialog({ open, onClose }: SupportDialogProps) {
  const { lang } = useLang();
  const en = lang === "en";
  const [loading, setLoading] = useState(false);
  const [envData, setEnvData] = useState<any>(null);

  // Auto-fill environment details
  useEffect(() => {
    if (!open) return;
    
    // Simulate detecting AE environment (would be real if running inside AE)
    const detectEnv = () => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      setEnvData({
        ae_version: "25.0 (Build 54)",
        cep_version: "12.0",
        os: isMac ? "macOS" : "Windows",
        browser: navigator.userAgent.split(" ").slice(-2).join(" "),
        modules: ["Cache", "Text", "Presets", "Tools", "Bridge", "Idea", "One", "Command"],
        gpu: "NVIDIA RTX 3060",
        ram: "32GB"
      });
    };
    detectEnv();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
      env: envData,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from("panel_reports").insert([
        { 
          message: `[SUPPORT] ${data.subject}\n\n${data.message}`,
          panel: "WebSupport",
          contact: data.email,
          severity: "info",
          status: "open"
        }
      ]);

      if (error) throw error;
      
      toast.success(en ? "Support ticket created!" : "সাপোর্ট টিকিট তৈরি হয়েছে!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(en ? "Failed to send. Try WhatsApp?" : "পাঠানো যায়নি। হোয়াটসঅ্যাপ চেষ্টা করবেন?");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl dark:border-blue-900/40 dark:bg-[#0b1224]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 px-6 py-8 text-white sm:px-10">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 transition hover:bg-white/20"
          >
            <X size={18} />
          </button>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            {en ? "Fast Support" : "দ্রুত সহায়তা"}
          </h2>
          <p className="mt-2 text-sm font-medium text-blue-100/80">
            {en ? "Environment details auto-attached for faster fixes." : "দ্রুত সমাধানের জন্য এনভায়রনমেন্ট ডিটেইলস স্বয়ংক্রিয়ভাবে যুক্ত করা হয়েছে।"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10">
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-blue-400">
                  {en ? "Your Email" : "আপনার ইমেইল"}
                </label>
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-blue-400">
                  {en ? "Subject" : "বিষয়"}
                </label>
                <select
                  required
                  name="subject"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-white"
                >
                  <option value="Bug Report">{en ? "Bug Report" : "বাগ রিপোর্ট"}</option>
                  <option value="Feature Request">{en ? "Feature Request" : "ফিচার রিকোয়েস্ট"}</option>
                  <option value="License Issue">{en ? "License Issue" : "লাইসেন্স সমস্যা"}</option>
                  <option value="General Help">{en ? "General Help" : "সাধারণ সাহায্য"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-blue-400">
                {en ? "Message" : "বার্তা"}
              </label>
              <textarea
                required
                name="message"
                rows={4}
                placeholder={en ? "What's happening?" : "কী সমস্যা হচ্ছে?"}
                className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-white"
              />
            </div>

            {/* Env Diagnostics Display */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                  {en ? "Diagnostic Data" : "ডায়াগনস্টিক ডেটা"}
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  {en ? "AUTO-DETECTED" : "স্বয়ংক্রিয়ভাবে সনাক্ত"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Cpu size={12} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-blue-100">AE {envData?.ae_version}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Terminal size={12} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-blue-100">CEP {envData?.cep_version}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers size={12} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-blue-100">{envData?.modules?.length} Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive size={12} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-blue-100">{envData?.os}</span>
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Send size={14} />
                  {en ? "Send Ticket" : "টিকিট পাঠান"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
