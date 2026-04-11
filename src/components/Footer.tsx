import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0f1e] text-white pt-20 pb-10 px-6 mt-auto">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#C9A84C] flex items-center justify-center">
                <Scale size={20} className="text-[#0a0f1e]" />
              </div>
              <h2 className="text-2xl font-serif font-bold tracking-tight">BailPredict</h2>
            </div>
            <p className="text-slate-400 font-medium max-w-sm leading-relaxed mb-8">
              Empowering the Indian legal community with high-precision AI predictions and automated drafting tools. Streamlining bail procedures with BERT and Gemini technology.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] bg-[#C9A84C]/10 px-3 py-1.5 rounded-lg border border-[#C9A84C]/20">
                AI Specialized
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                v2.0 Stable
              </span>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-[#C9A84C] mb-6">Navigation</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-slate-400 hover:text-white transition-colors font-medium">Home Dashboard</Link></li>
              <li><Link to="/predict" className="text-slate-400 hover:text-white transition-colors font-medium">Analyze & Predict</Link></li>
              <li><Link to="/ipc-guide" className="text-slate-400 hover:text-white transition-colors font-medium">IPC Section Guide</Link></li>
              <li><Link to="/my-cases" className="text-slate-400 hover:text-white transition-colors font-medium">My Legal Cases</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-[#C9A84C] mb-6">Resources</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Drafting Templates</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">API Documentation</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Legal Disclaimer</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm font-medium">
            &copy; 2025 BailPredict. All rights reserved. Registered Indian Legal Tech Entity.
          </p>
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <span>Built with BERT + Gemini AI</span>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1">
              Made with <Heart size={14} className="text-red-500 fill-red-500" /> for the Indian Judiciary
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
