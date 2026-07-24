import React, { useState } from 'react';
import { X, Copy, Check, Image as ImageIcon, Code, ExternalLink, Sparkles, FileCode } from 'lucide-react';
import { Supplier } from '../types';

interface DirectImageLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSupplier?: Supplier | null;
}

const presetImages = [
  {
    name: 'Logo Cargill (Fornecedor)',
    url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
    category: 'Logotipos'
  },
  {
    name: 'Lavoura de Soja - Safra 24/25',
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    category: 'Safra & Lavouras'
  },
  {
    name: 'Silos de Armazenamento de Grãos',
    url: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=800&q=80',
    category: 'Infraestrutura'
  },
  {
    name: 'Comprovante / Nota Fiscal Agrícola',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    category: 'Documentos'
  },
  {
    name: 'Colheitadeira em Ação',
    url: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80',
    category: 'Maquinários'
  }
];

export const DirectImageLinksModal: React.FC<DirectImageLinksModalProps> = ({
  isOpen,
  onClose,
  selectedSupplier
}) => {
  const [customUrl, setCustomUrl] = useState(selectedSupplier?.imageUrl || presetImages[0].url);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [altText, setAltText] = useState(
    selectedSupplier ? `Fornecedor ${selectedSupplier.nome}` : 'Imagem AgroGestão'
  );

  if (!isOpen) return null;

  const directUrl = customUrl.trim() || presetImages[0].url;

  const htmlImgTag = `<img src="${directUrl}" alt="${altText}" class="agro-img" style="max-width:100%; height:auto; border-radius:12px; border:1px solid #e2e8f0; shadow:0 4px 6px rgba(0,0,0,0.05);" />`;

  const markdownTag = `![${altText}](${directUrl})`;

  const fullHtmlCard = `<div style="background-color:#0b2310; color:#ffffff; padding:20px; border-radius:16px; font-family:sans-serif; max-width:600px;">
  <h2 style="color:#a3e635; margin-top:0;">AgroGestão — Relatório</h2>
  <img src="${directUrl}" alt="${altText}" style="width:100%; border-radius:12px; margin:12px 0; border:1px solid #1e4d25;" />
  <p style="color:#cbd5e1; font-size:14px; margin-bottom:0;">Controle de Dívidas e Fornecedores Agrícolas</p>
</div>`;

  const copyToClipboard = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(typeKey);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0b2310]">Gerador de Links Diretos de Imagens para HTML</h3>
              <p className="text-xs text-slate-500">
                Copie o link direto ou a tag &lt;img&gt; do HTML pronta para uso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Preset selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
              Escolher Imagem Preset do Sistema ou Inserir URL:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {presetImages.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomUrl(preset.url);
                    setAltText(preset.name);
                  }}
                  className={`p-2 rounded-lg border text-left flex flex-col items-center gap-1.5 transition ${
                    customUrl === preset.url
                      ? 'border-[#8cc627] bg-emerald-50 text-emerald-900 ring-2 ring-[#a3e635]/50'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-14 object-cover rounded-md"
                  />
                  <span className="text-[11px] font-semibold text-center line-clamp-1">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>

            {/* URL input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                URL Direta da Imagem:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://sua-imagem.com/foto.jpg"
                  className="flex-1 px-3.5 py-2 text-xs md:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-300 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir
                </a>
              </div>
            </div>
          </div>

          {/* Generated Snippets */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            {/* 1. Direct URL */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  1. Link Direto (URL):
                </span>
                <button
                  onClick={() => copyToClipboard(directUrl, 'url')}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200 px-2.5 py-1 rounded-md transition"
                >
                  {copiedType === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'url' ? 'Copiado!' : 'Copiar URL'}
                </button>
              </div>
              <code className="block text-[11px] font-mono text-slate-700 bg-white p-2 rounded border border-slate-200 truncate">
                {directUrl}
              </code>
            </div>

            {/* 2. HTML Tag */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-blue-600" />
                  2. Tag HTML &lt;img&gt; Pronta:
                </span>
                <button
                  onClick={() => copyToClipboard(htmlImgTag, 'html')}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-100/70 hover:bg-blue-200 px-2.5 py-1 rounded-md transition"
                >
                  {copiedType === 'html' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'html' ? 'Copiado!' : 'Copiar HTML <img />'}
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-800 bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {htmlImgTag}
              </pre>
            </div>

            {/* 3. Markdown Tag */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-purple-600" />
                  3. Tag Markdown:
                </span>
                <button
                  onClick={() => copyToClipboard(markdownTag, 'md')}
                  className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-100/70 hover:bg-purple-200 px-2.5 py-1 rounded-md transition"
                >
                  {copiedType === 'md' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'md' ? 'Copiado!' : 'Copiar Markdown'}
                </button>
              </div>
              <code className="block text-[11px] font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                {markdownTag}
              </code>
            </div>

            {/* Live Preview */}
            <div>
              <span className="block text-xs font-bold text-slate-700 mb-2">
                Pré-visualização da Imagem no HTML:
              </span>
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center">
                <img
                  src={directUrl}
                  alt={altText}
                  className="max-h-48 rounded-lg shadow-sm border border-slate-300 object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
